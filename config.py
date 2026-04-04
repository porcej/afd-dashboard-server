#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Application configuration.

All secrets and credentials MUST be supplied via environment variables (or a
local .env file loaded by your process manager). Defaults that embedded
passwords or tokens in this file were removed; rotate any values that were
ever committed to version control.

Changelog:
    - 2018-05-15 - Initial Commit
    - 2019-04-04 - Cleaned up a bit
    - 2026-04-03 - Removed hardcoded secrets; env-only credentials

"""

import os

basedir = os.path.abspath(os.path.dirname(__file__))

# Load `.env` from the project root (same directory as this file). Python does
# not read .env files unless something loads them into os.environ.
_dotenv_path = os.path.join(basedir, ".env")
try:
    from dotenv import load_dotenv

    load_dotenv(_dotenv_path, override=False)
except ImportError:
    pass


def _truthy_env(name):
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes", "on")


class Config(object):
    # Set SECRET_KEY in the environment. If DASHBOARD_DEBUG is true and it is
    # unset, create_app() assigns an ephemeral key (sessions reset on restart).
    SECRET_KEY = os.environ.get("SECRET_KEY")

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or "sqlite:///" + os.path.join(
        basedir, "app.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # SocketIO async mode (threading recommended for Python 3.13+)
    ASYNC_MODE = os.environ.get("ASYNC_MODE") or "threading"

    # Active911 - device registration id from Active911 (not committed)
    ACTIVE_911_DEVICE_ID = os.environ.get("ACTIVE_911_DEVICE_ID")

    # Telestaff - no defaults; set TS_* when using roster integration
    TS_DOMAIN = os.environ.get("TS_DOMAIN", "")
    TS_SERVER = os.environ.get("TS_SERVER", "")
    TS_USER = os.environ.get("TS_USER")
    TS_PASS = os.environ.get("TS_PASS")
    TS_COOKIE = os.environ.get("TS_COOKIE")

    # Admin UI - plain-text compare in auth/routes.py. When DASHBOARD_DEBUG is true,
    # create_app() sets ADMIN_USERNAME/ADMIN_PASSWORD to dev/dev if unset (see app/__init__.py).
    ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

    DASHBOARD_DEBUG = _truthy_env("DASHBOARD_DEBUG")

    DASHBOARD_HOST = os.environ.get("DASHBOARD_HOST") or "0.0.0.0"

    DASHBOARD_PORT = int(os.environ.get("DASHBOARD_PORT", "5000"))

    LOGGING_PATH = os.environ.get("LOGGING_PATH") or "log"

    # Standard logging module levels (e.g. 20 = INFO, 1 = very verbose legacy default).
    LOGGING_LEVEL = int(os.environ.get("LOGGING_LEVEL", "1"))

    # Leaflet map tiles (public token for browser; do not commit - use .env)
    MAPBOX_ACCESS_TOKEN = os.environ.get("MAPBOX_ACCESS_TOKEN") or ""
