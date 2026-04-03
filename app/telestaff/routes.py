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

    telestaff = ts.Telestaff(
        host=base,
        t_user=current_app.config["TS_USER"],
        t_pass=current_app.config["TS_PASS"],
        cookies=current_app.config["TS_COOKIE"],
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
