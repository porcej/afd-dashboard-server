#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Lets send out some Alerts

Changelog:
    - 2018-05-15 - Initial Commit
    - 2024-12-19 - Updated to use modern async a911client API
"""


__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"


from flask import current_app
from a911client import Active911Client
from app.models import Alert
from flask import session
from threading import Lock
from flask_socketio import SocketIO, Namespace, emit, join_room, leave_room, \
    close_room, rooms, disconnect
from config import Config
import json
import asyncio
from app import socketio
from app.active911 import bp
from app import db

# *====================================================================*
#         Active 911 Web Socket Client
# *====================================================================*
class Active911ClientWebSocket(Active911Client):
    def __init__(self, device_code, app=None):
        # Don't call super().__init__ here as it needs an event loop
        self.device_code = device_code
        self.app = app
        self.socketio = socketio
        self._client = None
        
    async def initialize(self):
        """Initialize the client within an async context"""
        if self._client is None:
            self._client = Active911Client(self.device_code)
            # Set up message handler
            self._client.message_handler = self.on_alert
        
    async def on_alert(self, alert_data):
        """
        This is where we process incoming alert data
        """
        alert_id = alert_data.get('id')
        alert_msg = alert_data

        # Save the alert to the db
        a = Alert(id=alert_id, content=json.dumps(alert_msg))
        with self.app.app_context():
            try:
                db.session.add(a)
                db.session.commit()
            except Exception as e:
                self.app.logger.info(f"DB CONNECTION FAILURE: {e}")
                db.session.rollback()

        # Alert the clients that we have a new alert
        self.socketio.emit('a911_alarm', \
                          {'type': 'alarm', 'id': alert_id}, \
                          namespace='/afd')

    async def on_connection_state_change(self, state):
        """Handle connection state changes"""
        if self.app:
            self.app.logger.info(f"Active911 connection state changed to: {state}")
            
    async def start(self):
        """Start the client"""
        if self._client is None:
            await self.initialize()
        
        # The client should now be running and handling messages
        # We'll keep this coroutine running to maintain the connection
        try:
            while True:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            self.app.logger.info("Active911 client stopped")

async def active911_thread(app):
    """Example of how to send server generated events to clients."""
    with app.app_context():
        client = Active911ClientWebSocket(
            device_code=app.config['ACTIVE_911_DEVICE_ID'], 
            app=app
        )
        # Here we remove any data in the DB so we can initialize it with
        # Fresh data
        try:
            db.session.query(Alert).delete()
            db.session.commit()
        except Exception as e:
            app.logger.info(f"DB CONNECTION FAILURE: {e}")
            db.session.rollback()

        await client.start()


# *====================================================================*
#         Socket IO Events
# *====================================================================*
class AFDNamespace(Namespace):
    def on_get_a911_alarms(self, count=1):
        these_alerts = Alert.query.with_entities(Alert.id) \
                                    .order_by(Alert.timestamp.desc()) \
                                    .limit(count) \
                                    .all()
        if these_alerts is None:
            emit('a911_alarm' "{'type': 'alarms', 'ids': []")
        else:
            these_alerts = [tuple(alert) for alert in these_alerts]
            emit('a911_alarm', {'type': 'alarms', 'ids': these_alerts })

    def on_my_event(self, message):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response',
             {'data': message['data'], 'count': session['receive_count']})

    def on_my_broadcast_event(self, message):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response',
             {'data': message['data'], 'count': session['receive_count']},
             broadcast=True)

    def on_join(self, message):
        join_room(message['room'])
        emit('my_response',
             {'data': 'In rooms: ' + ', '.join(rooms()),
              'count': session['receive_count']})

    def on_leave(self, message):
        leave_room(message['room'])
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response',
             {'data': 'In rooms: ' + ', '.join(rooms()),
              'count': session['receive_count']})

    def on_close_room(self, message):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'data': 'Room ' + message['room'] + ' is closing.',
                             'count': session['receive_count']},
             room=message['room'])
        close_room(message['room'])

    def on_my_room_event(self, message):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response',
             {'data': message['data'], 'count': session['receive_count']},
             room=message['room'])

    def on_disconnect_request(self):
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response',
             {'data': 'Disconnected!', 'count': session['receive_count']})
        disconnect()

    def on_my_ping(self):
        emit('my_pong')

    def on_a911_alarm(self, message):
        emit('a911_alarm', {'type': 'alarm', 'id': message['id']}, \
            broadcast=True)

    def on_a911_alarms(self, message):
        emit('a911_alarms', {'type': 'alarm', 'id': message['ids']}, \
            broadcast=True)

    def on_client_refresh(self, message):
        emit('client_refresh', {'type': 'admin', 'station': message['station']},\
            broadcast=True)

    def on_connect(self):
        emit('my_response', {'data': 'Connected', 'count': 0})

    def on_disconnect(self):
        pass

socketio.on_namespace(AFDNamespace('/afd'))