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
import os
import secrets
import warnings
from logging.handlers import RotatingFileHandler

from flask import Flask, current_app
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from threading import Lock
from config import Config


db = SQLAlchemy()
login = LoginManager()
login.login_view = 'auth.login'
login.login_message = "Please log in to access this page."
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

    if not app.config.get("SECRET_KEY"):
        if app.config.get("DASHBOARD_DEBUG"):
            app.config["SECRET_KEY"] = secrets.token_hex(32)
            warnings.warn(
                "SECRET_KEY is not set; using an ephemeral key (sessions reset on each "
                "restart). Set SECRET_KEY in the environment for stable sessions.",
                stacklevel=1,
            )
        else:
            raise RuntimeError(
                "SECRET_KEY must be set in the environment when DASHBOARD_DEBUG is false."
            )

    if not app.testing and not app.config.get("DASHBOARD_DEBUG"):
        for _key in ("ADMIN_USERNAME", "ADMIN_PASSWORD"):
            _v = app.config.get(_key)
            if _v is None or (isinstance(_v, str) and not _v.strip()):
                raise RuntimeError(
                    f"{_key} must be set in the environment when DASHBOARD_DEBUG is false."
                )

    # auth/routes.py compares submitted credentials to these strings; if they stay
    # None, any non-None form input fails the check. When debugging locally without
    # ADMIN_* in the environment, use fixed dev credentials (with warning).
    if app.config.get("DASHBOARD_DEBUG"):
        u = app.config.get("ADMIN_USERNAME")
        p = app.config.get("ADMIN_PASSWORD")
        need_username = u is None or (isinstance(u, str) and not u.strip())
        need_password = p is None or (isinstance(p, str) and not p.strip())
        if need_username:
            app.config["ADMIN_USERNAME"] = "dev"
        if need_password:
            app.config["ADMIN_PASSWORD"] = "dev"
        if need_username or need_password:
            warnings.warn(
                "ADMIN_USERNAME and/or ADMIN_PASSWORD not set; using dev/dev for local "
                "debug only. Set both in the environment for production.",
                stacklevel=1,
            )

    db.init_app(app)
    login.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, async_mode=app.config['ASYNC_MODE'])
    # scheduler.init_app(app)
    

    # Here we loaded HTTP Error Handling
    from app.errors import bp as errors_bp
    app.register_blueprint(errors_bp)

    # Load the authentication BluePrint for the admin console
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

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
