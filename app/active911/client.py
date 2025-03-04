#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Lets send out some Alerts

Changelog:
    - 2018-05-15 - Initial Commit
    - 2024-03-21 - Added delay and better error handling for initialization
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
import time
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
    """Initialize and start the Active911 client with retry logic and delay."""
    with app.app_context():
        max_retries = 3
        retry_delay = 5  # seconds
        initialization_delay = 2  # seconds

        # Add initial delay to allow for network setup
        app.logger.info("Waiting {} seconds before Active911 client initialization...".format(initialization_delay))
        time.sleep(initialization_delay)

        for attempt in range(max_retries):
            try:
                app.logger.info("Initializing Active911 client (attempt {}/{})...".format(attempt + 1, max_retries))
                
                # Initialize the client
                xmpp = Active911ClientWebSocket(device_code=app.config['ACTIVE_911_DEVICE_ID'], app=app)
                
                # Clear existing alerts from DB
                try:
                    db.session.query(Alert).delete()
                    db.session.commit()
                    app.logger.info("Successfully cleared existing alerts from database")
                except Exception as db_error:
                    app.logger.warn("Database cleanup failed: {}".format(str(db_error)))
                    db.session.rollback()

                # Initialize and start the client
                xmpp.initialize()
                app.logger.info("Active911 client initialized successfully")
                xmpp.run()
                break  # If we get here, initialization was successful

            except Exception as e:
                app.logger.error("Active911 client initialization failed (attempt {}/{}): {}".format(
                    attempt + 1, max_retries, str(e)))
                
                if attempt < max_retries - 1:  # Don't sleep on the last attempt
                    app.logger.info("Waiting {} seconds before retry...".format(retry_delay))
                    time.sleep(retry_delay)
                else:
                    app.logger.error("Failed to initialize Active911 client after {} attempts".format(max_retries))
                    raise  # Re-raise the exception if all retries failed

