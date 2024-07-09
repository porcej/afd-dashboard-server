#!/usr/bin/env python
# -*- coding: ascii -*-

"""
A Production harness for AFD Dashboard

Requires port 80 is open

Changelog:
    - 2018-05-15 - Initial Commit
"""


from app import create_app, db, socketio
from app.models import Alert, Roster, Station, Unit
from config import Config

# If we're using eventlet middleware (WSGI) we want to monkey patch
# all of our sockets, connections, and threads
# try:
#     import eventlet
#     eventlet.monkey_patch()
# except ImportError:
#     pass    # Default to Werkzeug/Threading, so we don't have to do anything

app = create_app()

if __name__ == '__main__':
    # Run the socketIO Stuff here

    socketio.run(app=app, \
                 host=Config.DASHBOARD_HOST, \
                 port=Config.DASHBOARD_PORT, \
                 debug=Config.DASHBOARD_DEBUG)
