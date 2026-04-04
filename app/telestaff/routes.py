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

from festis import telestaff as ts
from flask import current_app, jsonify
from app.telestaff import bp


def _telestaff_base_url():
    raw = (current_app.config.get("TS_SERVER") or "").strip()
    return raw


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


# *====================================================================*
#         Routes
# *====================================================================*

@bp.route('/roster')
@bp.route('/roster/')
@bp.route('/roster/<date>')
def roster(date=None):
    base = _telestaff_base_url()
    if not base:
        return jsonify(
            error="TS_SERVER is not set",
            hint="Set TS_SERVER in the environment (e.g. https://telestaff.example.gov)",
        ), 503
    if not (base.startswith("http://") or base.startswith("https://")):
        return jsonify(
            error="TS_SERVER must start with http:// or https://",
            hint=base[:80] + ("..." if len(base) > 80 else ""),
        ), 400

    login_err = _telestaff_login_config_error()
    if login_err is not None:
        return login_err

    cfg = current_app.config
    telestaff = ts.Telestaff(
        host=base,
        t_user=(cfg.get("TS_USER") or "").strip(),
        t_pass=cfg.get("TS_PASS"),
        cookies=cfg.get("TS_COOKIE") or "",
    )

    telestaff.do_login()
    response = telestaff.get_telestaff(kind="rosterFull", date=date)
    if not isinstance(response, dict):
        return jsonify(data=_sanitize_telestaff_payload(response))

    out = {
        "status_code": response.get("status_code"),
        "data": _sanitize_telestaff_payload(response.get("data")),
    }
    return jsonify(out)
