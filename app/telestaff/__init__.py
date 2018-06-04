#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Flask Blueprint to handle Telestaff

Changelog:
    - 2018-05-15 - Initial Commit

"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

from flask import Blueprint

bp = Blueprint('telestaff', __name__)

from app.telestaff import routes