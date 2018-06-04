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

# If we're using eventlet middleware (WSGI) we want to monkey patch
# all of our sockets, connections, and threads
try:
    import eventlet
    eventlet.monkey_patch()
except ImportError:
    pass    # Default to Werkzeug/Threading, so we don't have to do anything

app = create_app()

# This is so we can access the DB for migrations and the such
@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'Alert': Alert, 'Roster': Roster, 'Station': Station, 'Unit': Unit}


if __name__ == '__main__':
    # Run the socketIO Stuff here
    socketio.run(app=app, host='0.0.0.0', port=80, debug=True)
