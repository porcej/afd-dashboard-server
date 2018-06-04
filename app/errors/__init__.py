#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Flask Blueprint to handle standard HTTP Errors

Changelog:
    - 2018-05-15 - Initial Commit

"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

from flask import Blueprint

bp = Blueprint('errors', __name__)

from app.errors import handlers