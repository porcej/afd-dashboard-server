
/*
 *
 * AFD Webclient framework javascript
 *
 * Implement a webclient for AFD Dashboard messaging
 * as a jQuery ($) plugin
 * Using WebSockets (socket.io).
 * 0.0.1
 *
 */


function webclient(params){
	var connection;
	var status = io.connected;
	var settings = {
		"namepspace"	: '',		// Default to all namespaces
		"server" 		: location.protocol + '//' + document.domain + ':' + location.port, 
	};
	$.extend(settings, params);




};


(function ($, moment, Active911) {
	"use strict";

    /* =========================================================================
    
    getShift = given a date (moments) determines which shift is working

    ========================================================================= */
	function getShift( date ){

	}	// getShift()

	// Export
	// $.webclient 
})(jQuery, moment, Active911);




/**
 * AFD Webclient framework javascript
 *
 * Implement a webclient for AFD Dashboard messaging
 * Using WebSockets (socket.io).
 */


//$.ajaxSetup ({
// Disable caching of AJAX responses
//   cache: false
//});

// Singleton
active911 = new Active911();

// Track reconnects
var reconnect_stamps = [];

// Webclient specific methods








$(document).ready(function() {
	var localStorage = window.localStorage;


		// tmpClickHandler();
	function registerActive911(code) {

		var localStorage = window.localStorage;
		code = code || localStorage.getItem("device_code");
		code = code || '';


		$.ajax({
			type:		"POST",
			url:		active911.access_url,
			data:		{	"operation": "register", "device_code": code.trim() },
			dataType:	"jsonp",
			cache:		false,
			success:	function(data, callback) {

				if (data.result=='success') {

					// Registration successful.  Attempt init
					console.log("Registration successful");
					init();

				} else {

					$("#alerts").html('<div class="a91error">' +
									  '<h2 class="A91Alert_title">Active 911 Error</h2>'+
									  '<h3 class="A91Alert_address">' + data.message + '</h3>'+
									  '</div>');
					console.log("Active 911 Error: " + data.message);
				}
			}
		});
		return false;
	}

	$.registerActive911 = registerActive911;

	// Clicking on the gear will take you to settings
	$("#settings_icon img").click(function(){
		//Don't do anything if the dialog is already open.
		if($("#active911-webview-settings").length > 0){
			return;
		}
		$("<div id='active911-webview-settings' />").html("<span style='text-align: center; margin: 100px auto;'><img src='images/loader_large.gif' style='display: block; margin: 100px auto;' /></span>").dialog({
			title: "Settings",
			modal: true,
			autoOpen: true,
			"resizable"		: 	true,
			"width"			: 	'auto',
			"height" 		: 	'auto',
			"minHeight"		: 	500,
			"minWidth"		: 	500,
			"overflow"		:	"scroll",
			"buttons"		:	{

				"Save"	:	function() {

					$("#active911-webview-settings").trigger("save");
				},
				"Cancel"	:	function() {	$(this).dialog("close");	}
			},
			open: function() {

				// Load content
				$(this).load('html/settings.html');
			},
			close: function() {

				// Remove from DOM on close
				$(this).dialog("destroy").remove();
			}

		});
	});


	// Toggle the sidebars on/off and save the settings to the server
	$("#left_toggle_button").click(function(){

		$("#left_sidebar").toggle();

		if (active911.settings.alarm_sidebar == 'show'){

			active911.settings.alarm_sidebar = 'hide';

		} else {

			active911.settings.alarm_sidebar = 'show';

		}

		active911.save_settings();

		resize_map_to_bounds();

	});

	$("#right_toggle_button").click(function(){

		$("#right_sidebar").toggle();

		if (active911.settings.status_sidebar == 'show'){

			active911.set_setting('status_sidebar', 'hide');


		} else {

			active911.set_setting('status_sidebar','show');

		}

		active911.save_settings();

		resize_map_to_bounds();

	});


	init();

});


/**
 * Attempt to authenticate and connect to the webservice
 *
 */
function init() {
	// Connect to the webservice and try to authenticate.  If we fail, show the login box.
	$.ajax({
		type:		"POST",
		url:		active911.access_url,
		data:		{
			"operation"				: 	"init"
		},
		dataType:	"jsonp",
		cache:		false,
		success:	function(data, callback) {

			if (data.result=='success') {

				start_webclient(data.message);
				console.log(data.message);
				// resize_map_to_bounds();

			} else {

				if(data.message=="Unauthorized") {
					$.registerActive911();     
				} else {

					// Some other kind of error
					console.log(data.message);
					$(active911).trigger('json_error',data);
				}
			}
		}
	});
}


/**
 * Start the webclient
 *
 * @param data the data returned by the init call
 */
function start_webclient(data) {
	bypass_ratecheck = true;
	console.log("Active911 webclient Started.");

	// Save our device data
	active911.device=data.device;

	// Update our settings with those returned from the server
	try {

		var device_local_data = JSON.parse(active911.device.device_local_data);
		$.extend(active911.settings, device_local_data.webview_settings);

	} catch(e) {

		console.log("Unable to restore saved webview settings");
	}

	// Update the time (in case local computer is off)
	active911.set_server_time(data.device.unix_timestamp);

	// Create an array of alerts
	for (var i in data.alerts) {

		var a = new A91Alert(data.alerts[i]);
		active911.add_alert(a, true);
	}


	// Setup XMPP
	var xmpp_params={ 	
		"device_id"	:	551742, // active911.device.info.device_id,
		"registration_code"		:	138908977242662951145653177, //active911.device.info.registration_code,
		"incoming_callback"		:	function(m) {
			console.log("Command: "+m.command);
			switch(m.command.toLowerCase()) {
				case "popup":

					// If the popup is for us...show a popup
					if(active911.device.info.device_id == m.device_id || 0 === m.device_id){
						console.log("Pop-up message requested: " + m.message);
					}
					break;
				case "message":

					// Incoming alert or similar.  Play sound.
					active911.play_sound(m.sound);

					// If there is no alert ID, pop up a dialog with the message
					if(!m.alert_id) {
						console.log("Incoming message: " + m.message);

					} else {

						// If there is an alert ID, load the alert
						$.ajax({
							type:		"POST",
							url:		"/alert/" + m.message_id, // active911.access_url,
							// data:		{	"operation": "fetch_alert", "message_id": m.message_id },
							dataType:	"jsonp",
							cache:		false,
							success:	function(data, callback) {

								if (data.result=='success') {

									// Add alert to webclient, then to map
									var a=new A91Alert(data.message);
									active911.add_alert(a);

								} else {

									console.log("Logging out - " + data.message);
									stop_webclient();
								}
							}
						});
					}

					break;

				case "response":

					// Don't care about responses... but incase we ever do
					break;

				case "position":
					// Assume fixed position so we won't handle updates to position

					break;

				case "assignment":

					// Since we are doing a string comparison, make sure the string is 16 characters.
					while(m.assignment_id.length < 16){

						m.assignment_id = "0" + m.assignment_id;
					}

					if(device = active911.update_device_assignment(m.device_id,m.agency_id,m.assignment_id)){

						// Check to see we have the assignment
						if($("div.A91Assignment[assignment_id="+m.assignment_id+"][agency_id="+m.agency_id+"]").length == 0){

							// Implement a php callback to get the assignment.
							console.log("calling home for new assignments");
							console.log(m.assignment_id);
							// update_agency_assignments(device);

						} 

						// active911.draw_device_to_assignment(device);

						console.log("redrawing device "+m.device_id);
					}
					break;

				default:
					console.log("Unhandled command: "+m.command+" with message: "+m.message);
					break;
			}
		},
		"rooms":[]
	};

	for(var i in active911.device.agencies) {

		xmpp_params.rooms.push(active911.device.agencies[i].agency_id);
	}
	active911.xmpp=new Active911Xmpp(xmpp_params);

	// Delay before starting
	active911.timer_controller.add("connect",function(){


		console.log("Connecting XMPP");
		active911.xmpp.connect();


		// Add XMPP connection monitoring.  This includes server pings since it seems to be the only reliable way
		active911.timer_controller.add("pinger",function(){

			if(active911.xmpp.is_connected()) {
				//We are currently connected.  Let's ping to keep the connection alive, and to also check that we are really connected still
				active911.xmpp.ping( {
					"timeout": 10000,
					/*"success": function() {
						console.log("Ping OK");
						},*/
					"failure":function() {

						// Ping failure.  Make a clean disconnect and start a reconnect timer.
						console.log("Ping Timeout");
						active911.xmpp.disconnect();
						reconnect();
					}
				});
			}
			else if(active911.xmpp.is_disconnected()) {	
				//We are in a disconnected state, let's reconnect
				reconnect();
			} 
			else if(!active911.xmpp.is_connecting()){
				//Hmm, not connected, not disconnected, but also not waiting for initial connection to complete.  Must be some error state.
				//Push the xmpp object into a disconnect state so we can reconnect cleanly on the next pass
				active911.xmpp.disconnect();
			}
			

			return true;

		}, 5); // Once every five seconds is the same ping frequency used by the microsoft apps

		// Remove inactive devices (every 60 seconds)
		active911.timer_controller.add("inactivity",function(){

			for (i in active911.devices) {

				var device=active911.devices[i];
				if(device.position_age() > 360) {

					if(device.get_map_marker()) {

						active911.map.remove_device_marker(device);
					}
				}
			}

			return true;
		}, 60);

		// Remove alarms more than 4 hours old (every 10 minutes)
		active911.timer_controller.add("old_alarms",function(){

			active911.cull_old_alerts();
			return true;
		}, 600);

		return false;

	}, active911.startup_delay);


	// Manage connection display (every 1s)
	active911.timer_controller.add("display_state",function(){

		if(active911.live==active911.xmpp.is_connected()) {

			return true;
		}

		if(active911.live=active911.xmpp.is_connected()) {

			// We just connected
			console.log("Status change: XMPP connected");
			$("#status img").attr("src","images/connected_animation.gif");

		} else {

			console.log("Status change: XMPP DISCONNECTED");
			$("#status img").attr("src","images/disconnected_animation.gif");

		}

		return true;

	}, 1);

	active911.timer_controller.add("flapping_connection", function() {
		// Check if auto-recover is turned on
		if(active911.settings.auto_recover == "off"){
			return;
		}

		// Get our cutoff time
		var cutoff = new Date();
		cutoff.setSeconds(cutoff.getSeconds() - 180); // Only care over the past 3 minutes

		// Determine how many reconnects have occured since the cutoff
		var recent_reconnects = 0;
		for(var i = 0; i < reconnect_stamps.length; i++) {
			if(reconnect_stamps[i] > cutoff) {
				recent_reconnects++;
			}
		}

		if(recent_reconnects > 6) { // If there were a reconnect about once every 30 seconds over the past 3 minutes
			console.log("THE CONNECTION TO ACTIVE911 XMPP IS FLAPPING");
			console.log("REFRESHING PAGE");
			location.reload();
		}

		// Remove all reconnect stamps older than the cutoff
		for(var i = reconnect_stamps.length - 1; i > -1; i--) {
			if(reconnect_stamps[i] < cutoff) {
				reconnect_stamps.splice(i, 1);
			}
		}
	}, 10);

}

/**
 * Reconnect
 *
 * Attempts reconnect every 10s until connected
 */
function reconnect() {

	console.log("Reconnect called");
	// Make sure there is not another reconnect attempt in progress (and that we are really not connected)
	if(active911.timer_controller.exists("reconnect") || active911.xmpp.is_connected()) {

		console.log("Reconnect already in operation.  Returning.");
		return;
	}

	// This is a new reconnect, so let's track it
	reconnect_stamps.push(new Date());

	// Set up a reconnect timer
	active911.timer_controller.add("reconnect",function(){
		// We need to make sure we are not already connected and/or in the process of connecting
		// There was a bug where, if the webclient was in a "connecting" state, it would start queueing up new connections indefinitely
		// This usually happened on slow machines where the connections would be queued faster than they could be completed and dequeued

		if(!active911.xmpp.is_connected() && !active911.xmpp.is_connecting()) {	
			console.log("Reconnect attempt");
			active911.xmpp.connect();
		}

		return !active911.xmpp.is_connected();	// Remove ourself once connected

	}, 10);
}



/**
 * Stop webclient (log out)
 *
 */
function stop_webclient() {

	// Disconnect XMPP
	active911.gps=null;
	active911.timer_controller.remove_all();
	active911.xmpp.disconnect();
	active911.xmpp=null;

}

/**
 * Sort dom elements by a specified attribute
 *
 * @param container_element is the DOM object holding what needs to be sorted
 * @param dom_element is the element we want to sort on
 * @param the attribute is what we want to use as the sorter
 *
 */
function dom_sorter(container_element,dom_element,attribute){

	var container = $(container_element);
	var sortable_elements = container.children(dom_element).get();

	// Sort based on the attribute specified
	sortable_elements.sort(function(a,b){

		value1 = $(a).attr(attribute).toLowerCase();
		value2 = $(b).attr(attribute).toLowerCase();

		if (value1 < value2){

			return -1;
		} else if (value1 > value2){

			return 1;
		} else {

			return 0;
		}
	});

	// Once sorted, redisplay
	$.each(sortable_elements, function(idx, item){

		container.append(item);
	});

}


function createCookie(name, value, days) {
	console.log("***************** Creating cookie: " + name);
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

