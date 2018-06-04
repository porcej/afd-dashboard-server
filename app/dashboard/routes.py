#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Server up some hot Dashboards

Changelog:
    - 2018-05-15 - Initial Commit
"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

from flask import render_template, current_app
from config import Config
from app.dashboard import bp
from app.models import Alert


# *====================================================================*
#         Routes
# *====================================================================*
# *====================================================================*
#         Routes
# *====================================================================*
@bp.route('/station')
@bp.route('/station/<station>')
@bp.route('/station/<station>/<alertalways>')
@bp.route('/station/<station>/<alertalways>/')
def station(station=None, alertalways=False):
    return render_template('dashboard/station.html', \
                            station=station, \
                            alertalways=alertalways)