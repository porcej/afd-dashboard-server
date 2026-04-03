#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Flask Blueprint to handle Telestaff

Changelog:
    - 2018-05-15 - Initial Commit
    - 2019-04-04 - Cleaned up a bit

"""

import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'this is a secret key that you will never guess'


    # Database Stuff
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
        # 'mysql+pymysql://user:password@172.17.0.2/'

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Threading stuff
    # Set this variable to "threading", "eventlet" or "gevent" to specify
    # different async modes, or leave it set to None for the application to choose
    # the best option based on installed packages.
    # Using 'threading' mode for Python 3.13 compatibility
    ASYNC_MODE = os.environ.get('ASYNC_MODE') or 'threading'

    # Active911 Client stuff
    ACTIVE_911_DEVICE_ID = os.environ.get('ACTIVE_911_DEVICE_ID') or '551742-ZQFT'


    # Telestaff Stuff
    TS_DOMAIN = os.environ.get('TS_DOMAIN') or 'alexgov.net\\'
    TS_SERVER = os.environ.get('TS_SERVER') or 'https://telestaff.alexandriava.gov'

    TS_USER = os.environ.get('TS_USER') or 'dashboard_user'
    TS_PASS = os.environ.get('TS_PASS') or '900Second900Second'
    TS_COOKIE = os.environ.get('TS_COOKIE') or "pdIevTunx4Bg=p1|dom|aNEd+JnchP14yV2JB/fx9vTrodahUVydxwp8KiMgH5U=; pdIevTunx4Bg_legacy=p1|dom|aNEd+JnchP14yV2JB/fx9vTrodahUVydxwp8KiMgH5U=; pcIevTunx4Bg=di9N9QkZDVumh62kQKnrmfA7luvxCotG26DHVNcSH74=; pcIevTunx4Bg_legacy=di9N9QkZDVumh62kQKnrmfA7luvxCotG26DHVNcSH74=;"
    # D_USER = os.environ.get('D_USER') or 'joseph.porcelli'
    # # D_PASS = os.environ.get('D_PASS') or 'Xe75mnhm'
    # D_PASS = 'helloErica_10'

    # Admin User Creds
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME') or 'porcej'
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'xe75mnhm'


    # Web UI and general app Stuff
    if (os.environ.get('DASHBOARD_DEBUG') in ['True', 'TRUE', 'true', '1']):
        DASHBOARD_DEBUG = True
    else:
        DASHBOARD_DEBUG = False

    DASHBOARD_HOST = os.environ.get('DASHBOARD_HOST') or '0.0.0.0'

    # DASHBOARD_PORT = int(os.environ.get('DASHBOARD_PORT')) or 8841
    DASHBOARD_PORT = 8841

    DASHBOARD_DEBUG = True


    LOGGING_PATH = os.environ.get('LOGGING_PATH') or 'log'

    # Logging Levels:
    #
    # Log Level     | Use Value
    # --------------+-----------
    # CRITICAL      | 50
    # ERROR         | 40
    # WARNING       | 30
    # INFO          | 20
    # DEBUG         | 10
    # VERBOSE       | 1
    # NOTSET        | 0

    LOGGING_LEVEL = os.environ.get('LOGGING_LEVEL') or 1   # VERBOSE
