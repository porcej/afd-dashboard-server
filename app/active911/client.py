#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Active911 integration using a911client (Active911Client + asyncio).

Changelog:
    - 2018-05-15 - Initial Commit
    - 2026-04-03 - Switched from removed Active911 symbol to Active911Client
"""


__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"


import asyncio
import json
import time

from a911client import Active911Client
from a911client.Active911Exceptions import Active911Error

from app import db, socketio
from app.models import Alert

_ACTIVE911_RETRY_SEC = 60


def start_active911_client(app):
    """Run the Active911 client in this thread using an asyncio event loop."""

    with app.app_context():
        try:
            db.session.query(Alert).delete()
            db.session.commit()
        except Exception as e:
            app.logger.warning(
                "DB CONNECTION FAILURE - Unable to initialize database: %s", e
            )
            db.session.rollback()

    device_code = app.config["ACTIVE_911_DEVICE_ID"]

    async def main():
        async with Active911Client(device_code, logger=app.logger) as client:

            async def on_alert(alert_data):
                if not isinstance(alert_data, dict):
                    app.logger.warning(
                        "Unexpected alert payload type: %s", type(alert_data)
                    )
                    return
                alert_id = alert_data.get("id")
                if alert_id is None:
                    app.logger.warning("Alert payload missing id")
                    return

                row = Alert(id=alert_id, content=json.dumps(alert_data))
                with app.app_context():
                    try:
                        db.session.add(row)
                        db.session.commit()
                        app.logger.info("Alert received and added from Active 911.")
                    except Exception as e:
                        app.logger.warning("DB failure when adding alert: %s", e)
                        db.session.rollback()

                socketio.emit(
                    "a911_alarm",
                    {"type": "alarm", "id": alert_id},
                    namespace="/afd",
                )

            client.alert_handler = on_alert
            await client.register_device()
            await client.authenticate()
            await client.active911_xmpp()

    while True:
        try:
            asyncio.run(main())
            break
        except Active911Error as e:
            with app.app_context():
                app.logger.error(
                    "Active911 client error (%s): %s. Retrying in %s s. "
                    "Unauthorized usually means ACTIVE_911_DEVICE_ID is wrong, "
                    "revoked, or the device is not registered for this agency.",
                    type(e).__name__,
                    e,
                    _ACTIVE911_RETRY_SEC,
                )
        except Exception:
            with app.app_context():
                app.logger.exception(
                    "Unexpected Active911 thread error; retrying in %s s.",
                    _ACTIVE911_RETRY_SEC,
                )
        time.sleep(_ACTIVE911_RETRY_SEC)
