#!/usr/bin/env python
# -*- coding: ascii -*-

"""DB-backed Telestaff URL and cookie header; env (TS_*) is fallback when unset."""

import json
from datetime import datetime

from app import db
from app.models import TelestaffSettings

SINGLETON_ID = 1


def get_settings_row():
    """Return the singleton row or None if never created."""
    return TelestaffSettings.query.get(SINGLETON_ID)


def get_or_create_settings_row():
    row = get_settings_row()
    if row is None:
        row = TelestaffSettings(id=SINGLETON_ID)
        db.session.add(row)
        db.session.commit()
    return row


def effective_server(app):
    """Prefer DB `server_url` when set; else `TS_SERVER` from config/env."""
    row = get_settings_row()
    if row and row.server_url and str(row.server_url).strip():
        return str(row.server_url).strip()
    return (app.config.get("TS_SERVER") or "").strip()


def effective_cookie(app):
    """Prefer DB `cookie_header` when the column was written; else env."""
    row = get_settings_row()
    if row is not None and row.cookie_header is not None:
        return row.cookie_header
    return app.config.get("TS_COOKIE") or ""


def persist_telestaff_cookies(cookie_string):
    """Save refreshed cookie header from festis after a roster fetch."""
    row = get_or_create_settings_row()
    row.cookie_header = cookie_string
    db.session.commit()


def save_admin_settings(server_url, cookie_header):
    """Save admin form. Empty strings clear DB fields (NULL) so env is used again."""
    row = get_or_create_settings_row()
    row.server_url = server_url.strip() if server_url and server_url.strip() else None
    row.cookie_header = (
        cookie_header.strip() if cookie_header and cookie_header.strip() else None
    )
    row.updated_at = datetime.utcnow()
    db.session.commit()


def save_schedule_settings(enabled, interval_minutes, app):
    """
    Enable/disable server-side roster polling and interval (minutes).
    Persists to DB and reapplies APScheduler when the scheduler is running.
    """
    row = get_or_create_settings_row()
    row.roster_scheduler_enabled = bool(enabled)
    if interval_minutes is None or interval_minutes < 1:
        minutes = 15
    else:
        minutes = min(1440, int(interval_minutes))
    row.roster_fetch_interval_seconds = max(60, min(86400, minutes * 60))
    row.updated_at = datetime.utcnow()
    db.session.commit()
    from app.telestaff.scheduler import reschedule_telestaff_scheduler

    reschedule_telestaff_scheduler(app)


def persist_last_roster_snapshot(payload_dict):
    """Store JSON snapshot and fetch time after a successful roster response."""
    row = get_or_create_settings_row()
    row.last_roster_fetched_at = datetime.utcnow()
    row.last_roster_json = json.dumps(payload_dict, default=str)
    db.session.commit()
