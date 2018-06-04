#!/usr/bin/env python
# -*- coding: ascii -*-

"""
Active911 Python
Elixir and Tonic
Extends Sleek XMPP's Client XMPP to support Active911.

Changelog:
    - 2018-05-15 - Initial Commit

"""

__author__ = "Joseph Porcelli (porcej@gmail.com)"
__version__ = "0.0.1"
__copyright__ = "Copyright (c) 2018 Joseph Porcelli"
__license__ = "MIT"

__all__ = ['Active911']


import sys
import logging
import sleekxmpp
import requests
import json


class Active911(sleekxmpp.ClientXMPP):
    """
    A really simple wrapper for Active911
    """

    # Here are out application constants
    api_url = "https://access.active911.com/interface/web_api.php"
    domain = "push.active911.com"

    session = requests.Session()

    app = None
    logger = logging


    def __init__(self, device_code, app=None):
        """
        Initilize the XMPP Client
        """
        if app:
            self.app = app;
            self.logger = app.logger
        else:
            self.logger = logging

        registerResource = "?operation=register&device_code=" 

        # Get the device id and registration infromation for 
        #   device code and set cookie
        response = self.session.get(self.api_url + registerResource + device_code);
        rjson = json.loads(response.content)

        if rjson['result'] == 'success':
            self.logger.info("Client registration to Active911 sucessful.")

        elif rjson['result'] == 'Unauthorized':
            self.logger.error('Client registration to Active911 failed: Unauthorized')
            raise Exception('Client registration to Active911 failed: Unauthorized')

        else:
            self.logger.error('Client registration to Active911 failed: ' \
                + rjson['message'] )
            raise Exception('Client registration to Active911 failed: ' \
                + rjson['message'] )

        # Added on 2018-04-26 - Check to make sure the cookies
        if ((not 'a91_device_id' in self.session.cookies) and 
                (not 'a91_registration_code' in self.session.cookies)):

            # We raise an exception rather than quiting to let the app handle the issue
            self.logger.error("Invalid Active911 Device ID or bad network connection.")
            raise Exception('Invalid Active911 Device ID or bad network connection')
            # sys.exit("Invalid Active911 Device ID or bad network connection.")

        # JID = "deivce[a91_device_id]@[domain]"
        jid = "device" + self.session.cookies['a91_device_id'] + "@" + self.domain
        password = self.session.cookies['a91_registration_code']

        sleekxmpp.ClientXMPP.__init__(self, jid, password)

        self['feature_mechanisms'].unencrypted_plain = True

        self.register_plugin('xep_0030') # Service Discovery
        self.register_plugin('xep_0004') # Data Forms
        self.register_plugin('xep_0060') # PubSub
        self.register_plugin('xep_0199') # XMPP Ping

        # Add handler for starting XMPP sessions and parsing incoming messages
        self.add_event_handler("session_start", self.start)
        self.add_event_handler("message", self.message)
        self.add_event_handler("position", self.position)   # Need to run api->init first

    def start(self, event):
        """
        All we want to do  is start... but to be sure everything
        is working correctly, we will send an empty presnce stanza
        """
        self.send_presence()
        # We don't care about a contact list so we skip fetching a roster
        # self.get_roster()
        self.logger.info("XMPP Session started...")


    def message(self, msg):
        """
        This is where we process incoming message stanzas
        """
        if msg['type'] in ('chat', 'normal'):
            alert_ids = msg['body'].split(':')

            # Reguest alert from Web API
            alert_msg = self.session.get(
                "%s?operation=fetch_alert&message_id=%s&_=%s" %
                    (self.api_url, alert_ids[1], alert_ids[2]))
            alert_data = alert_msg.json()
            
            self.logger.info("Message {} received.".format(alert_ids[1]))
            self.alert(alert_ids[1], alert_data)

    def initialize(self):
        """
        Here we download last 10 A911 alerts
        we may do other stuff here later
        """
        # Initialize for position reporting
        response = self.session.get(self.api_url + "?&operation=init")
        data = json.loads(response.content)

        if data['result'] == 'success':
            self.logger.info("Active911 sucessfully initilized.")
            alerts = data['message']['alerts']
            for idx, alert in enumerate(alerts):
                alert_response = {'result': 'success', \
                                    'message': alert, \
                                    'init': True}
                with self.app.app_context():
                    self.alert(idx, alert_response)


        elif data['result'] == 'Unauthorized':
            self.logger.error('Client initilization to Active911 failed: Unauthorized')
            raise Exception('Client initilization to Active911 failed: Unauthorized')

        else:
            self.logger.error('Client initilization to Active911 failed: ' \
                + data['message'] )
            raise Exception('Client initilization to Active911 failed: ' \
                + data['message'] )


    def alert(self, alert_id, alert_msg):
        """
        This is where we do somehting with the alert.
        This method should be implamented by the client
        to do something with the generated alert
        """
        self.logger.info("Alert {}:\n\n{}\n".format(alert_id, alert_msg))



    def position(self, loc):
        """
        This is where we process position information... big hint...
            we don't actually do anything here
        """
        self.logger.info(loc['from'] + " new position is " + loc['body'] + ".")

    def run(self, block=True):
        """
        Performs connection handling 
         - If block is true (default), blocks keeps the thread alive
         		until a disconnect stanza is received or a termination
         		commaned is issued (<Ctrl> + C)
         - If block is false  - thread does not block only use this 
         		if your're handling threading in the client

        """
        # We wrap the XMPP stuff in a try..finally clause
        # to force the disconnect method to run if there is any error
        try:
            # Connect to the XMPP server and start processing XMPP stanzas.
            if not self.connect():
                self.logger.error("Unable to connect to Active911")
                sys.exit(1)	# If we can't connect, then why are we here

            self.logger.info("Connected to Active911 via XMPP.")
            self.process(block=block)
            self.logger.info("Closing XMPP connection to Active911.")
            
        finally:
            self.disconnect()
            self.logger.info("Disconnected from Active911.")


if __name__ == '__main__':
    """
    By Default we do nothing.
    """
    None
