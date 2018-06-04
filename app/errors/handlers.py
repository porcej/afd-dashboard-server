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

from flask import render_template
from app.errors import bp


@bp.app_errorhandler(404)
def not_found_error(error):
    return render_template('errors/error.html', code='404'), 404


@bp.app_errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('errors/error.html', code='500'), 500
