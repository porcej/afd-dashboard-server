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

import json

from flask import jsonify
from app.active911 import bp
from app.models import Alert


# *====================================================================*
#         Routes
# *====================================================================*
@bp.route('/alarm/<id>')
def alarm(id=None):
    alert = Alert.query.filter_by(id=id).first()
    if alert is None:
        return jsonify(result='error', message='Alert not found'), 404
    if not alert.content:
        return jsonify(result='error', message='Alert has no content'), 404
    try:
        payload = json.loads(alert.content)
    except (json.JSONDecodeError, TypeError):
        return jsonify(result='error', message='Invalid alert JSON'), 500
    # dashboard.js fetchAlert() expects result/message (not raw JSON body)
    return jsonify(result='success', message=payload)

@bp.route('/alarms')
def alarms(id=None):
    alerts_q = Alert.query.order_by(Alert.id.asc()).all()

    if alerts_q is None:
        return '{result: "error", message: "Alert not found"}'

    alerts = [({'id': alert.id, 'msg': alert.content}) for alert in alerts_q]

    return jsonify(result='success', message={'alerts': alerts})
