#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Server up some hot Telestaff Data

Changelog:
    - 2018-05-15 - Initial Commit
"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

from festis import telestaff as ts
from flask import render_template, current_app
from app.telestaff import bp

# *====================================================================*
#         Routes
# *====================================================================*

@bp.route('/roster')
@bp.route('/roster/')
@bp.route('/roster/<date>')
def roster(date=None):
    # ts_user = Config.TS_USER
    telestaff = ts.Telestaff(host='https://telestaff.alexandriava.gov', 
                                    t_user=current_app.config['TS_USER'], \
                                    t_pass=current_app.config['TS_PASS'], \
                                    domain='alexgov.net\\',  \
                                    d_user=current_app.config['D_USER'], \
                                    d_pass=current_app.config['D_PASS'])

    return telestaff.getTelestaff(kind='roster', date=date, jsonExport=True)