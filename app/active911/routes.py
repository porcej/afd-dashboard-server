#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Server up some hot Active911

Changelog:
    - 2018-05-15 - Initial Commit
"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

from flask import render_template, jsonify
from app.active911 import bp
from app.models import Alert


# *====================================================================*
#         Routes
# *====================================================================*
@bp.route('/alarm/<id>')
def alarm(id=None):
    alert = Alert.query.filter_by(id=id).first()
    if alert is None:
        return '{result: "error", message: "Alert not found"}'
    return alert.content

@bp.route('/alarms')
def alarms(id=None):
    alerts_q = Alert.query.order_by(Alert.id.asc()).all()

    if alerts_q is None:
        return '{result: "error", message: "Alert not found"}'

    alerts = [({'id': alert.id, 'msg': alert.content}) for alert in alerts_q]

    return jsonify(result='success', message={'alerts': alerts})
