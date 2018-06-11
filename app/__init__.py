#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Marshalling for flask dashboarding app

Changelog:
    - 2018-05-15 - Initial Commit

"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

import logging
from logging.handlers import RotatingFileHandler
import os
from flask import Flask, current_app
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from threading import Lock
from config import Config


db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()

thread = None
thread_lock = Lock()


def create_app(config_class=Config):
    """
    This is an applicaiton factory to generate this app
        Is that just the nicest thing you've ever heard?
    """

    # Now that threads are tracked, let us create the app
    app = Flask(__name__)
    app.config.from_object(config_class)
    # app.config.from_object(Config1())

    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, async_mode=app.config['ASYNC_MODE'])
    # scheduler.init_app(app)
    

    # Here we loaded HTTP Error Handling
    from app.errors import bp as errors_bp
    app.register_blueprint(errors_bp)

    # Here we load Telestaff handling
    from app.telestaff import bp as telestaff_bp
    app.register_blueprint(telestaff_bp)

    # Here we load Ye'Ol Chalk-board Dashboard
    from app.dashboard import bp as dashboard_bp
    app.register_blueprint(dashboard_bp)

    # Here we load Active 911 Alerting 
    # (and the Enterprise Data Bus (EDB))
    from app.active911 import bp as a911_bp
    app.register_blueprint(a911_bp)

    # Last but not least load the admin stuff
    from app.admin import bp as admin_bp
    app.register_blueprint(admin_bp)

    # scheduler.start()

    # Now check if we are debug/testing if not load logging
    if not app.debug and not app.testing:
        lp = app.config['LOGGING_PATH']

        # If log directory DNE create it
        if not os.path.exists(lp):
            os.makedirs(lp)

        # Setup rotating logs
        rlh = logging.handlers.TimedRotatingFileHandler(
                                os.path.join(lp, 'dashboard.log'), 
                                when='midnight')
        logging.basicConfig(level=app.config['LOGGING_LEVEL'],
                format='%(asctime)s %(levelname)-8s %(message)s',
                datefmt='%H:%M:%S',
                handlers=[rlh])

        # Don't forget to add the Logging Handler to the Flask app
        app.logger.addHandler(rlh)

        app.logger.info('\t *==============================*')
        app.logger.info('\t * AFD Dashboard Server Startup *')
        app.logger.info('\t *==============================*\n')

    return app










# app = Flask(__name__)
# app.config.from_object(Config)
# db = SQLAlchemy(app)
# migrate = Migrate(app, db)
# socketio = SocketIO(app, async_mode=app.config['ASYNC_MODE'])


# thread = None
# thread_lock = Lock()

# from app.errors import bp as errors_bp
# from app.telestaff import bp as telestaff_bp
# from app.active911 import bp as a911_bp
# # from app.dashboard import bp as dashboard_bp
# # from app.admin import bp as admin_bp


# app.register_blueprint(errors_bp)
# app.register_blueprint(telestaff_bp)
# app.register_blueprint(a911_bp)
# app.register_blueprint(dashboard_bp)
# app.register_blueprint(admin_bp)





from app import models


# #++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++#



# db = SQLAlchemy(app)
# migrate = Migrate()
# app.register_blueprint()

# from threading import Lock
# from flask import Flask, render_template, session, request
# from flask_socketio import SocketIO, Namespace, emit, join_room, leave_room, \
#     close_room, rooms, disconnect


# from a911 import Active911
# import json
# import sys
# from config import Config
# from datetime import datetime, timedelta

# import logging
# from flask import Flask
# from config import Config
# from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate


# app = Flask(__name__)
# app.config.from_object(Config)
# async_mode = config['ASYNC_MODE']
# db = SQLAlchemy(app)
# migrate = Migrate(app, db)

# socketio = SocketIO(app, async_mode=async_mode)
# thread = None
# thread_lock = Lock()

# logging.basicConfig(level=1,
#                     format='%(asctime)s %(levelname)-8s %(message)s',
#                     datefmt='%H:%M:%S')

# from dashboard import models
# from dashboard import routes
# from dashboard import events
