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
import json

# *====================================================================*
#         Routes
# *====================================================================*

@bp.route('/roster')
@bp.route('/roster/')
@bp.route('/roster/<date>')
def roster(date=None):
    # ts_user = Config.TS_USER
    telestaff = ts.Telestaff(host=current_app.config['TS_SERVER'],  \
                                    t_user=current_app.config['TS_USER'], \
                                    t_pass=current_app.config['TS_PASS'], \
                                    cookie=current_app.config['TS_COOKIE'])

    telestaff.do_login()
    response = telestaff.get_telestaff(kind='rosterFull', date=date)
    if response.get("status_code", 0) == 200:
        return json.dumps(response.get(data, ""))
    else:
        return jsdon.dumps(response)
