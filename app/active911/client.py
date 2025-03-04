#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Lets send out some Alerts

Changelog:
    - 2018-05-15 - Initial Commit
"""


__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"


from flask import current_app
from a911client import Active911
from app.models import Alert
from flask import session
from threading import Lock
from flask_socketio import SocketIO, Namespace, emit, join_room, leave_room, \
    close_room, rooms, disconnect
from config import Config
import json
import asyncio
from app import thread_lock, thread, socketio
from app.active911 import bp
from app import db

import logging

# *====================================================================*
#         Active 911 Web Socket Client
# *====================================================================*
class Active911ClientWebSocket(Active911):
    def alert(self, alert_id, alert_msg):
        """
        This is where we process incoming message stanzas
        """
        # Save the alert to the db
        a = Alert(id=alert_id, content=json.dumps(alert_msg))
        with self.app.app_context():
            try:
                db.session.add(a)
                db.session.commit()
                # logger.info("Alert received and added from Active 911.")
                self.app.logger.info("Alert received and added from Active 911.")
            except:
                self.app.logger.warn("DB CONNECTION FAILURE WHEN ADDING ALERT")
                db.session.rollback()

        # Alert the clients that we have a new alert
        socketio.emit('a911_alarm', \
                      {'type': 'alarm', 'id': alert_id}, \
                      namespace='/afd')

def start_active911_client(app):
    """Example of how to send server generated events to clients."""
    with app.app_context():
        xmpp = Active911ClientWebSocket(device_code=app.config['ACTIVE_911_DEVICE_ID'], app=app)
        # Here we remove any data in the DB so we can initialize it with
        # Fresh data
        try:
            db.session.query(Alert).delete()
            db.session.commit()
        except:
            app.logger.warn("DB CONNECTION FAILURE - Unable to initialize database")
            db.session.rollback()

        xmpp.initialize()
        xmpp.run()

