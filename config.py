#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Flask Blueprint to handle Telestaff

Changelog:
    - 2018-05-15 - Initial Commit

"""

import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'this is a secret key that you will never guess'

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Set this variable to "threading", "eventlet" or "gevent" to test the
    # different async modes, or leave it set to None for the application to choose
    # the best option based on installed packages.
    ASYNC_MODE = None

    ACTIVE_911_DEVICE_ID = ''

    TS_USER = ''
    TS_PASS = ''
    D_USER = ''
    D_PASS = ''

    LOGGING_PATH = 'log'

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

    LOGGING_LEVEL = 1   # VERBOSE