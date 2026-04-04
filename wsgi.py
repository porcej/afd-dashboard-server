#!/usr/bin/env python
# -*- coding: ascii -*-
"""
WSGI entry for Gunicorn.

Flask-SocketIO with async_mode=threading is served with ``gthread`` workers
(see afddashboard.py / Dockerfile). Use a single worker (-w 1) for Socket.IO.

Active911 runs in a daemon thread started once per process (see below).
"""

import threading

from app import create_app
from app.active911.client import start_active911_client

app = create_app()

_active911_lock = threading.Lock()
_active911_started = False


def _start_active911_once():
    global _active911_started
    with _active911_lock:
        if _active911_started:
            return
        _active911_started = True
        t = threading.Thread(target=start_active911_client, args=(app,))
        t.daemon = True
        t.start()


_start_active911_once()
