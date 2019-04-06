#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Server up a HOT Admin Console

Changelog:
    - 2018-05-15 - Initial Commit
    - 2019-04-06 - Added login required for admin routes
"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

from flask import render_template, current_app, request, jsonify
from flask_login import current_user, login_required
from app.admin import bp
from app.models import Alert, Station, Unit
from app import db, socketio
from sqlalchemy import exc


# *====================================================================*
#         Routes
# *====================================================================*
@bp.route('/admin')
@bp.route('/admin/')
@bp.route('/admin/index')
@login_required
def admin():
    """
    A Really simple landing page for the admin tools
    """
    stations = Station.query.order_by(Station.name.asc()).all()
    return render_template('admin/admin.html', stations=stations)

@bp.route('/admin/console')
@bp.route('/admin/console/')
@login_required
def adminconsole():
    """
    A console for monitoring the dashboard system's interworkings
    """
    these_alerts = Alert.query.with_entities(Alert.id) \
                                  .order_by(Alert.timestamp.desc()) \
                                  .all()
    stations = Station.query.order_by(Station.name.asc()).all()
    return render_template('admin/console.html', \
                            alarms=these_alerts, \
                            stations=stations, \
                            async_mode=current_app.config['ASYNC_MODE'])

@bp.route('/admin/_station/new/', methods=['POST'])
@login_required
def _station_new():
    """
    Creates a station:
    params:
        name: station name to create
    """
    if request.form:
        data = request.form
    else:
        data = request.args
    
    station_name = data.get('name', '', type=str).upper()
    station = Station(name=station_name)
    data = ''

    try:
        db.session.add(station)
        db.session.commit()
                # Alert the clients that we have a new alert
        socketio.emit('unit_update', namespace='/afd')
        return jsonify(result='success', \
            message='Station ' + station_name + ' added.')
    except exc.IntegrityError:
        db.session.rollback()
        return jsonify(result='error', \
            message='Unable to add station ' + station_name + '.')


@bp.route('/admin/_station/delete/<name>/', methods=['POST'])
@login_required
def _station_delete(name=None):
    """
    Removes a station:
    url params:
        name: station name to delete
    """
    try:
        db.session.delete(Station.query.filter_by(name=name.upper())\
                                        .first())
        db.session.commit()
        socketio.emit('unit_update', namespace='/afd')
        return jsonify(result='success', \
                        message='Station ' + name + ' removed.')
    except exc.IntegrityError:
        db.session.rollback()
        return jsonify(result='error', \
                       message='Unable to delete station ' + name + '.')


@bp.route('/admin/_station/edit/<name>/', methods=['POST'])
@login_required
def _station_edit(name=None):
    """
    Editss a station:
    url params:
        name: station name to edit (old name)
    params:
        name: station's new name
    """
    station = Station.query.filter_by(name=name.upper()).first()
    if request.form:
        data = request.form
    else:
        data = request.args

    station.name = data.get('name', '', type=str).upper()
    data = ''
    
    try:
        db.session.commit()
        socketio.emit('unit_update', namespace='/afd')
        return jsonify(result='success',\
            message='Station ' + name + ' -> ' + station.name)
    except exc.IntegrityError:
        db.session.rollback()
        return jsonify(result='error', \
            message='Unable to update station ' + name + '.')


@bp.route('/admin/_station/', methods=['GET'])
@bp.route('/admin/_station/<name>/', methods=['GET'])
def _station(name=None):
    """
    Returns station a station or stations details
    url params:
        name (optional): name of station to get details for
    """    
    stations = {}
    order = Station.name.asc()
    if name is None:
        stations_q = Station.query.order_by(order).all()
    else:
        stations_q = Station.query.filter_by(name=name.upper()).\
            order_by(order).all()
                                    
    for station in stations_q:
        stations[station.name] = {
                'id':     station.id, \
                'homed':  ",".join([row.name \
                    for row in station.home.all() \
                    if 'name' in vars(row)]), \
                'alert':  ",".join([row.name \
                    for row in station.alert.all() \
                    if 'name' in vars(row)]) }
    return jsonify(result='success', message={'stations': stations})
            

@bp.route('/admin/_unit/new/', methods=['POST'])
@login_required
def _unit_new():
    """
    Creates a unit:
    params:
        name: Unit name
        home (optional): Unit's home station
        alert (optional): Station to alert for
    """
    if request.form:
        data = request.form
    else:
        data = request.args

    unit_name = data.get('name', '', type=str).upper()
    unit_home = data.get('home', '', type=str).upper()
    unit_alert = data.get('alert', '', type=str).upper()
    data = ''

    unit = Unit(name=unit_name)
    if unit_home != '':
        unit.home = Station.query.filter_by(name=unit_home).first()
    if unit_alert != '':
        unit.alert = Station.query.filter_by(name=unit_alert).first()
    try:
        db.session.add(unit)
        db.session.commit()
        socketio.emit('unit_update', namespace='/afd')
        return jsonify(result='success', \
            message='Unit ' + unit.name + ' added.')
    except exc.IntegrityError:
        db.session.rollback()
        return jsonify(result='error',\
         message='Unable to add ' + unit.name + '.')


@bp.route('/admin/_unit/delete/<name>/', methods=['POST'])
@login_required
def _unit_delete(name=None):
    """
    Removes a unit:
    url params:
        name: unit to delete
    """
    try:
        db.session.delete(Unit.query.filter_by(name=name.upper())\
                                    .first())
        db.session.commit()
        socketio.emit('unit_update', namespace='/afd')
        return jsonify(result='success', \
                        message='Station ' + name + ' removed.')
    except exc.IntegrityError:
        db.session.rollback()
        return jsonify(result='error', \
                        message='Unable to delete station ' + name + '.')


@bp.route('/admin/_unit/edit/<name>/', methods=['POST'])
@login_required
def _unit_edit(name=None):
    """
    Editss a unit:
    url params:
        name: unit name to edit (old name)
    params:
        name (optional): unit's new name
        home (optional): Unit's home station
        alert (optional): Station to alert for
    """
    if request.form:
        data = request.form
    else:
        data = request.args

    unit_name = data.get('name', '', type=str).upper()
    unit_home = data.get('home', '', type=str).upper()
    unit_alert = data.get('alert', '', type=str).upper()

    data = ''

    unit = Unit.query.filter_by(name=name.upper()).first()
    if unit_name != '':
        unit.name = unit_name
    if unit_home != '':
        unit.home = Station.query.filter_by(name=unit_home).first()
    if unit_alert != '':
        unit.alert = Station.query.filter_by(name=unit_alert).first()
    try:
        db.session.commit()
        socketio.emit('unit_update', namespace='/afd')
        return jsonify(result='success', \
            message='Unit ' + unit.name + ' changed.')
    except exc.IntegrityError:
        db.session.rollback()
        return jsonify(result='error',\
         message='Unable to update ' + name + '.')


@bp.route('/admin/_unit/', methods=['GET'])
@bp.route('/admin/_unit/<name>', methods=['GET'])
@login_required
def _unit(name=None):
    """
    A simple route ot handle request to list, add new, and delete
    units
    url params:
        name (optional): Unit name
    """
    # units = []
    order = Unit.name.asc()
    if name is None:
        Units_q = Unit.query.order_by(order).all()
    else:
        Units_q = Unit.query.filter_by(name=name.upper()).\
            order_by(order).all()

    units = [({'name': unit.name, 'home': unit.home.name, 'alert': unit.home.name}) for unit in Units_q]

    return jsonify(result='success', message={'units': units})


@bp.route('/admin/stationmanager', methods=['GET'])
@bp.route('/admin/stationmanager/', methods=['GET'])
@login_required
def stationmanager():
    """
    A Web GUI to manage stations and their names
    """
    stations_q = Station.query.order_by(Station.name.asc()).all()

    stations = []
    for station in stations_q:
        stations.append( {
                'name':     station.name, \
                'id':       station.id, \
                'homed':    ", ".join([row.name \
                    for row in station.home.all() \
                    if 'name' in vars(row)]), \
                'alert':    ", ".join([row.name \
                    for row in station.alert.all() \
                    if 'name' in vars(row)]) })

    return render_template('admin/stationmanager.html', \
                            stations=stations)

@bp.route('/admin/unitmanager', methods=['GET'])
@bp.route('/admin/unitmanager/', methods=['GET'])
@login_required
def unitnmanager():
    """
    A Web GUI to manage units and their assigned stations
    """
    stations = Station.query.order_by(Station.name.asc()).all()
    units = Unit.query.order_by(Unit.name.asc()).all()

    return render_template('admin/unitmanager.html', \
                            stations=stations, \
                            units=units)


