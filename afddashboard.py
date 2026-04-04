#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Run the dashboard with Gunicorn (gthread worker; matches Flask-SocketIO threading).

Dockerfile invokes Gunicorn directly; this module is for local ``python afddashboard.py``.
"""

import os
import sys

from config import Config


def main():
    bind = f"{Config.DASHBOARD_HOST}:{Config.DASHBOARD_PORT}"
    threads = str(Config.GUNICORN_THREADS)

    args = [
        sys.executable,
        "-m",
        "gunicorn",
    ]
    if Config.DASHBOARD_DEBUG:
        args.append("--reload")
    args.extend(
        [
            "-k",
            "gthread",
            "-w",
            "1",
            "--threads",
            threads,
            "--bind",
            bind,
            "--access-logfile",
            "-",
            "--error-logfile",
            "-",
            "wsgi:app",
        ]
    )
    os.execvp(sys.executable, args)


if __name__ == "__main__":
    main()
