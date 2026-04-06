#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Some models to store data

Changelog:
    - 2018-05-15 - Initial Commit
"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

from flask import current_app
from config import Config
from datetime import datetime, timedelta
from app import db

# *====================================================================*
#         MODELS
# *====================================================================*
class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(2048))
    timestamp = db.Column(db.DateTime, index=True, \
                                       default=datetime.utcnow)

    def __repr__(self):
        return '<Alert {}>'.format(self.content)


class Roster(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(90), index=True)
    content = db.Column(db.String())
    timestamp = db.Column(db.DateTime, index=True,\
                                       default=datetime.utcnow)

    def __repr__(self):
        return '<Roster for {}>'.format(self.date)

class Station(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(24), index=True, unique=True)
    home = db.relationship('Unit', backref='home', \
                                   lazy='dynamic', \
                                   foreign_keys='Unit.home_id')
    alert = db.relationship('Unit', backref='alert', \
                                    lazy='dynamic', \
                                    foreign_keys='Unit.alert_id')

    def __repr__(self):
        return '<Station: {}, id: {}>'.format(self.name, self.id)

class Unit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(24), index=True, unique=True)
    home_id = db.Column(db.Integer, db.ForeignKey('station.id'))
    alert_id = db.Column(db.Integer, db.ForeignKey('station.id'))

    def __repr__(self):
        return '<Unit {}>'.format(self.name)


class TelestaffSettings(db.Model):
    """Singleton (id=1): optional override for Telestaff host URL and cookie header."""

    __tablename__ = "telestaff_settings"

    id = db.Column(db.Integer, primary_key=True)
    server_url = db.Column(db.String(512), nullable=True)
    cookie_header = db.Column(db.Text(), nullable=True)
    updated_at = db.Column(db.DateTime(), nullable=True)
    last_roster_fetched_at = db.Column(db.DateTime(), nullable=True)
    last_roster_json = db.Column(db.Text(), nullable=True)
    roster_scheduler_enabled = db.Column(db.Boolean(), nullable=False, default=False)
    roster_fetch_interval_seconds = db.Column(db.Integer(), nullable=False, default=900)

    def __repr__(self):
        return '<TelestaffSettings id={}>'.format(self.id)
