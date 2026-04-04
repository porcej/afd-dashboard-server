#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Socket.IO namespace for dashboard real-time events.

Active911 connectivity lives in app.active911.client (Active911Client).

Changelog:
    - 2018-05-15 - Initial Commit
    - 2026-04-03 - Dropped legacy Active911 subclass; fixed alarm list emit
"""


__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"


from flask import session
from flask_socketio import Namespace, disconnect, emit, join_room, leave_room, \
    close_room, rooms

from app import socketio
from app.models import Alert


# *====================================================================*
#         Socket IO Events
# *====================================================================*
class AFDNamespace(Namespace):
    def on_get_a911_alarms(self, count=1):
        these_alerts = Alert.query.with_entities(Alert.id) \
                                    .order_by(Alert.timestamp.desc()) \
                                    .limit(count) \
                                    .all()
        if not these_alerts:
            emit("a911_alarm", {"type": "alarms", "ids": []})
        else:
            ids = [row[0] for row in these_alerts]
            emit("a911_alarm", {"type": "alarms", "ids": ids})

    def on_my_event(self, message):
        session["receive_count"] = session.get("receive_count", 0) + 1
        emit(
            "my_response",
            {"data": message["data"], "count": session["receive_count"]},
        )

    def on_my_broadcast_event(self, message):
        session["receive_count"] = session.get("receive_count", 0) + 1
        emit(
            "my_response",
            {"data": message["data"], "count": session["receive_count"]},
            broadcast=True,
        )

    def on_join(self, message):
        join_room(message["room"])
        emit(
            "my_response",
            {
                "data": "In rooms: " + ", ".join(rooms()),
                "count": session["receive_count"],
            },
        )

    def on_leave(self, message):
        leave_room(message["room"])
        session["receive_count"] = session.get("receive_count", 0) + 1
        emit(
            "my_response",
            {
                "data": "In rooms: " + ", ".join(rooms()),
                "count": session["receive_count"],
            },
        )

    def on_close_room(self, message):
        session["receive_count"] = session.get("receive_count", 0) + 1
        emit(
            "my_response",
            {
                "data": "Room " + message["room"] + " is closing.",
                "count": session["receive_count"],
            },
            room=message["room"],
        )
        close_room(message["room"])

    def on_my_room_event(self, message):
        session["receive_count"] = session.get("receive_count", 0) + 1
        emit(
            "my_response",
            {"data": message["data"], "count": session["receive_count"]},
            room=message["room"],
        )

    def on_disconnect_request(self):
        session["receive_count"] = session.get("receive_count", 0) + 1
        emit(
            "my_response",
            {"data": "Disconnected!", "count": session["receive_count"]},
        )
        disconnect()

    def on_my_ping(self):
        emit("my_pong")

    def on_a911_alarm(self, message):
        emit(
            "a911_alarm",
            {"type": "alarm", "id": message["id"]},
            broadcast=True,
        )

    def on_a911_alarms(self, message):
        emit(
            "a911_alarms",
            {"type": "alarm", "id": message["ids"]},
            broadcast=True,
        )

    def on_client_refresh(self, message):
        emit(
            "client_refresh",
            {"type": "admin", "station": message["station"]},
            broadcast=True,
        )

    def on_connect(self):
        emit("my_response", {"data": "Connected", "count": 0})

    def on_disconnect(self):
        pass


socketio.on_namespace(AFDNamespace("/afd"))
