#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Background interval job to fetch Telestaff roster (APScheduler).

Only one process runs the scheduler when a Unix file lock can be acquired
(see Gunicorn with multiple workers: use one worker or expect to restart
after changing the schedule so the lock-holding process reloads config).
"""

import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler

from app.telestaff.settings_store import get_settings_row

logger = logging.getLogger(__name__)

JOB_ID = "telestaff_roster_fetch"
_scheduler = None
_lock_fd = None
_flask_app = None


def _try_acquire_singleton_lock(app):
    """Return True if this process should run the scheduler (Unix lock)."""
    global _lock_fd
    if os.name == "nt":
        return True
    try:
        import fcntl
    except ImportError:
        return True
    os.makedirs(app.instance_path, exist_ok=True)
    path = os.path.join(app.instance_path, "telestaff_scheduler.lock")
    fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o644)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        os.close(fd)
        logger.info(
            "Telestaff scheduler: another process holds the lock; "
            "not starting scheduler in this worker."
        )
        return False
    _lock_fd = fd
    return True


def _scheduled_roster_fetch():
    global _flask_app
    if _flask_app is None:
        return
    with _flask_app.app_context():
        row = get_settings_row()
        if row is None or not row.roster_scheduler_enabled:
            return
        from app.telestaff.routes import telestaff_roster_payload

        _payload, err = telestaff_roster_payload(date=None)
        if err is not None:
            resp, status = err
            data = resp.get_json(silent=True) or {}
            msg = data.get("error") or data.get("hint") or str(status)
            logger.warning("Telestaff scheduled fetch failed: %s", msg)
        else:
            logger.info("Telestaff scheduled roster fetch completed.")


def reschedule_telestaff_scheduler(app):
    """Apply interval and enabled flag from DB to APScheduler."""
    global _scheduler
    if _scheduler is None:
        return
    with app.app_context():
        row = get_settings_row()
        enabled = bool(row and row.roster_scheduler_enabled)
        seconds = (
            int(row.roster_fetch_interval_seconds)
            if row and row.roster_fetch_interval_seconds
            else 900
        )
        seconds = max(60, min(86400, seconds))

    try:
        _scheduler.remove_job(JOB_ID)
    except Exception:
        pass

    if not enabled:
        logger.info("Telestaff scheduler: disabled in DB.")
        return

    _scheduler.add_job(
        _scheduled_roster_fetch,
        "interval",
        seconds=seconds,
        id=JOB_ID,
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    logger.info(
        "Telestaff scheduler: job registered every %s seconds.", seconds
    )


def init_telestaff_scheduler(app):
    """Start background scheduler (call from create_app)."""
    global _scheduler, _flask_app

    if app.testing:
        return
    if app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        return

    if not _try_acquire_singleton_lock(app):
        return

    _flask_app = app
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.start()
    reschedule_telestaff_scheduler(app)
