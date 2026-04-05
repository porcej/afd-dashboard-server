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

import json

from flask import render_template, current_app, request, jsonify, flash, redirect, url_for
from flask_login import current_user, login_required
from app.admin import bp
from app.models import Alert, Station, Unit
from app.telestaff.routes import telestaff_roster_payload
from app.telestaff.settings_store import (
    effective_server as telestaff_effective_server,
    get_settings_row,
    save_admin_settings,
    save_schedule_settings,
)
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

def _roster_fetch_error_message(err_response):
    """Build a short message from a roster error (jsonify tuple response)."""
    resp, _status = err_response
    data = resp.get_json(silent=True) or {}
    parts = [data.get("error"), data.get("hint")]
    return ": ".join(p for p in parts if p) or "Roster fetch failed."


@bp.route('/admin/telestaff', methods=['GET', 'POST'])
@bp.route('/admin/telestaff/', methods=['GET', 'POST'])
@login_required
def telestaff_settings():
    """
    Configure Telestaff base URL and cookie header stored in the database.
    Empty fields fall back to TS_SERVER / TS_COOKIE from the environment.
    """
    stations = Station.query.order_by(Station.name.asc()).all()
    if request.method == 'POST':
        action = request.form.get('action', 'save')
        if action == 'fetch_roster':
            _payload, err = telestaff_roster_payload(date=None)
            if err is not None:
                flash('Error: ' + _roster_fetch_error_message(err))
            else:
                flash('Roster fetched; snapshot saved.')
            return redirect(url_for('admin.telestaff_settings'))
        if action == 'save_schedule':
            enabled = request.form.get('roster_scheduler_enabled') == 'on'
            minutes = request.form.get('roster_fetch_interval_minutes', type=int)
            save_schedule_settings(enabled, minutes, current_app)
            flash('Roster schedule saved.')
            return redirect(url_for('admin.telestaff_settings'))
        server_url = request.form.get('server_url', '') or ''
        cookie_header = request.form.get('cookie_header', '') or ''
        save_admin_settings(server_url, cookie_header)
        flash('Telestaff settings saved.')
        return redirect(url_for('admin.telestaff_settings'))
    row = get_settings_row()
    interval_minutes = 15
    if row and row.roster_fetch_interval_seconds:
        interval_minutes = max(1, row.roster_fetch_interval_seconds // 60)
    return render_template(
        'admin/telestaff_settings.html',
        stations=stations,
        row=row,
        env_server=(current_app.config.get('TS_SERVER') or '').strip(),
        effective_server=telestaff_effective_server(current_app),
        interval_minutes=interval_minutes,
    )


@bp.route('/admin/telestaff/roster-json', methods=['GET'])
@bp.route('/admin/telestaff/roster-json/', methods=['GET'])
@login_required
def telestaff_roster_json():
    """Pretty-printed JSON of the last stored roster response (admin only)."""
    stations = Station.query.order_by(Station.name.asc()).all()
    row = get_settings_row()
    raw = row.last_roster_json if row else None
    if not raw:
        pretty_json = None
    else:
        try:
            pretty_json = json.dumps(
                json.loads(raw), indent=2, sort_keys=True, default=str
            )
        except (TypeError, ValueError):
            pretty_json = raw
    return render_template(
        'admin/telestaff_roster_json.html',
        stations=stations,
        pretty_json=pretty_json,
        last_fetch=row.last_roster_fetched_at if row else None,
    )


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


