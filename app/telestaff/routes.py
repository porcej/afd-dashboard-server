#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Server up some hot Telestaff Data

Changelog:
    - 2018-05-15 - Initial Commit
"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

import json

from festis import telestaff as ts
from flask import current_app, jsonify
from app.telestaff import bp
from app.telestaff.settings_store import (
    effective_cookie,
    effective_server,
    get_settings_row,
    persist_last_roster_snapshot,
    persist_telestaff_cookies,
)


def _sanitize_telestaff_payload(obj):
    """festis may put RequestException/HTTPError objects in response['data']."""
    if isinstance(obj, Exception):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _sanitize_telestaff_payload(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize_telestaff_payload(v) for v in obj]
    return obj


def _telestaff_login_config_error():
    """Return (error_dict, status) if roster login env is incomplete, else None."""
    cfg = current_app.config
    user = (cfg.get("TS_USER") or "").strip()
    password = cfg.get("TS_PASS")
    if not user:
        return (
            jsonify(
                error="TS_USER is not set",
                hint="Set TS_USER (and TS_PASS) in the environment for Telestaff login.",
            ),
            503,
        )
    if password is None or (isinstance(password, str) and password.strip() == ""):
        return (
            jsonify(
                error="TS_PASS is not set",
                hint="Set TS_PASS in the environment for Telestaff login.",
            ),
            503,
        )
    return None


def telestaff_roster_payload(date=None):
    """
    Perform Telestaff roster fetch and persist cookies + last roster snapshot.

    Returns:
        (payload_dict, None) on success
        (None, (response, status_code)) on error (suitable as Flask return value)
    """
    base = effective_server(current_app)
    if not base:
        return None, (
            jsonify(
                error="TS_SERVER is not set",
                hint=(
                    "Set TS_SERVER in the environment or configure the Telestaff URL "
                    "in Admin / Telestaff."
                ),
            ),
            503,
        )
    if not (base.startswith("http://") or base.startswith("https://")):
        return None, (
            jsonify(
                error="TS_SERVER must start with http:// or https://",
                hint=base[:80] + ("..." if len(base) > 80 else ""),
            ),
            400,
        )

    login_err = _telestaff_login_config_error()
    if login_err is not None:
        return None, login_err

    cfg = current_app.config
    telestaff = ts.Telestaff(
        host=base,
        t_user=(cfg.get("TS_USER") or "").strip(),
        t_pass=cfg.get("TS_PASS"),
        cookies=effective_cookie(current_app) or "",
    )

    response = telestaff.get_telestaff(kind="rosterFull", date=date)
    cookies_dict = telestaff.get_cookies()
    if cookies_dict:
        cookie_string = "; ".join(f"{k}={v}" for k, v in cookies_dict.items())
        persist_telestaff_cookies(cookie_string)
        cfg["TS_COOKIE"] = cookie_string

    if not isinstance(response, dict):
        out = {"data": _sanitize_telestaff_payload(response)}
    else:
        out = {
            "status_code": response.get("status_code"),
            "data": _sanitize_telestaff_payload(response.get("data")),
        }

    persist_last_roster_snapshot(out)
    return out, None


# *====================================================================*
#         Routes
# *====================================================================*

@bp.route('/roster/snapshot')
@bp.route('/roster/snapshot/')
def roster_snapshot():
    """
    Return the last stored roster JSON (no Telestaff call).
    Dashboards poll this to refresh the display after server-side scheduled fetches.
    """
    row = get_settings_row()
    if row is None or not row.last_roster_json:
        return jsonify(
            error="No roster snapshot yet",
            hint=(
                "Enable the scheduled fetch or use Fetch latest roster in Admin / Telestaff, "
                "or call GET /roster once."
            ),
        ), 503
    try:
        payload = json.loads(row.last_roster_json)
    except (TypeError, ValueError):
        return jsonify(error="Stored roster snapshot is invalid JSON."), 500
    return jsonify(payload)


@bp.route('/roster')
@bp.route('/roster/')
@bp.route('/roster/<date>')
def roster(date=None):
    out, err = telestaff_roster_payload(date=date)
    if err is not None:
        return err
    return jsonify(out)
