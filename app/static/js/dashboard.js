/***

Fire Service Dashboarding Services
Copyright 2019 Joseph Porcelli
0.0.1

***/



(function ($, moment, L) {
	"use strict";

	var settings = {};
	var active911;
	var edb;
	var namespace = 'afd';


	/* =========================================================================

	afd - Constructor: Builds out an AFD Dashboard

	========================================================================= */
    function afd( options ){
    	settings = options || window.afdDashboardConfig || {};

  		// Display clock
		$(".cb-clock").clock();

		// Handle WX Forecast Display
		$.wx({'forecastOffice': 'LWX', 'grid': '96,66',});
		$.wx.nws();	// Fetch initial WX data run
		$.wx.run();	// Start WX Update Process
        
		// Load Telestaff
		$.webstaff({});

		// Initilize Alert Map
		initMap();

		// Get Assigned Units from server
		updateAssignments();

		// Create Active911 object
		active911 = new Active911();

		// Create Enterprise Data Bus (connect via SocketIO)
		edb = io.connect(location.protocol
							+ '//' + document.domain 
							+ ':' + location.port 
							+ '/' + namespace);

		// register EDB events
		registerEDBEvents();

		// Customize Active911 to work for us
		customizeActive911();

        return this;    // we support chaining
    }   // afd()

    /* =========================================================================
    
    relaod - reloads the webpage

    ========================================================================= */
	function reload( hardReload=true ){
		if (!($('#alertModal').data('bs.modal') || {isShown: false})._isShown){
			location.reload(true);
		} else {
			// If alert modal is open, wait 30 seconds and try again
			setTimeout(function() { reload(); }, 30000);
		}
	}	// reload


	/* =========================================================================

	initMap - initilizes Leaflet.js map

	========================================================================= */
	function initMap(){
		// Initiate Leaflet map
		$.alertMap = L.map('alertMap', { zoomControl:false, attributionControl:false }).setView([38.8109981,-77.0910554], 17);
		
		L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
									 '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
									 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			tileSize: 512,
			maxZoom: 18,
			zoomOffset: -1,
			id: 'mapbox/streets-v11',
			accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
		}).addTo($.alertMap);
			
		$.alertMap.currentCallMarker = L.marker([38.8109981,-77.0910554]).addTo($.alertMap);
			
		$('#alertModal').on('shown.bs.modal', function (e) {
	  		$.alertMap.invalidateSize();
		});
	}	// initMap()


	/* =========================================================================

	updateAssignments - Updates Unit assignments from server

	========================================================================= */
	function updateAssignments(){
		console.log("Updateing assigned units.");
	    $.ajax({
	        type: "GET",
	        url: '/admin/_station/' + settings['station'] + '/',
	        dataType : 'json',
	        success: function(json, textStatus, request){
	            var station = json.message.stations[settings['station']];
	            if (typeof station != 'undefined'){
	                settings['home_units_str'] = station.homed.toUpperCase();
	                settings['alert_units'] = station.alert.toUpperCase().split(',');
	                settings['home_units'] = station.homed.toUpperCase().split(',');
	            } else {
	                console.warn("Station " + settings['station'] + " not found.");

	            }
	        }
	     });
	}	// updateAssignments()


	/* =========================================================================

	registerEDBEvents - Regisuter events for use with the EDB

	========================================================================= */
	function registerEDBEvents(){

		// Connect event
		edb.on('connect', function() {
			console.log("Connection established to dashboard server.")
			edb.emit('get_a911_alarms', 10);
		});

		
		// Disconnect event
		edb.on('disconnect', function() {
			console.log("Disconnected from dashboard server.")
		});

		
		// Handler for server sent alerts (a911_alarm) messages
		edb.on('a911_alarm', function(msg){
			console.log("Active 911 " + msg.type + " received.");
			if (msg.type === 'alarm'){
				// If single alarm is recieved, fetch the alarm data,
				// parse and send to screen.
				fetchAlert(msg.id);
			} else if (msg.type === 'alarms'){
				// If multiple alarms are received, parse them individually
				for (var adx = msg.ids.length; adx > 0; adx--) {
					fetchAlert(msg.ids[adx-1]);
				}
			}
		});

		// Handler for server sent settings (a911_setting) messages
		edb.on('a911_setting', function(msg){
			console.log("Active 911 " + msg.key + " Update Received.");
			active911.set_settings(msg.key, msg.val);
			active911.cull_old_alerts();
		});

		// Handler for server sent client refresh (client_refresh) messages.
		edb.on('client_refresh', function(msg){
		    if ((msg.station == "") || (msg.station == settings.station)){
				reload();
		    }
		});


		// Handler for server sent unit update (unit_update) messages;
		edb.on('unit_update', function(msg){
		    updateAssignments();
		});
	}	// registerEDBEvents()


	/* =========================================================================

	fetchAlert - Fetches alarm information for alarm with the given id.

	========================================================================= */
	function fetchAlert(id){
		var alert_url = location.protocol + '//' + document.domain + ':' + location.port + '/alarm/' + id;
		console.log("Received Alarm: " + id);
		
		$.ajax({
			type: 'GET',
			url: alert_url,
			dataType : 'json',
			success: function(json, textStatus, request){
				if (json.result == 'success' ){
					// Here we update the age since there is a possibility the alarm was stagnant on the server
					json.message.age = Math.round(moment().diff(moment.unix(json.message.timestamp))/1000);
					var a = new A91Alert(json.message);

					// We don't want to Alert for alarms > 2 minutes
					console.log("age: " + (json.message.age/60).toString());
					if (json.message.age/60 > 2){
						active911.add_alert(a, true);
					} else {
						active911.add_alert(a);
					}
				} 
			},
			error: function(xhr, ajaxOpts, thrownError){
				console.log("Warning: Alarm #" + id + " not found.");
			}
		});
	}   // fetchAlert()


	/* =========================================================================

	customizeActive911 - Override Active911 object to fit this dashboard.

	========================================================================= */
	function customizeActive911(moreCustom){
		/**
		 * Draw an alarm
		 *
		 * Overridden from base
		 * @param alert the alert to draw
		 */
		Active911.prototype.draw_alert=function(alert) {

			// Take this time to remove old alerts
			this.cull_old_alerts();


			// Has this alert already been drawn on the screen once?
			if($(alert.get_html_selector()).length) {
			    return; /* TODO - Should really modify alert */
			}

			// Get the alert HTML
			$("#alerts").prepend(alert.to_html());


			// Click for details
			$(alert.get_html_selector()).click(function() {
				var alert_id = parseInt($(this).attr("alert_id"));
				var alert = active911.get_alert(parseInt($(this).attr("alert_id")));

				if(alert) {
					$("div#fullscreenAlert .A91AlertDetail").html(alert.to_detail_html());
					$("#alertModal").find(".A91Alert").after($("<div/>").addClass("cb-timer"));
					$("#alertModal").modal('show');
					$(".cb-timer").timer();
				}
			});
		};

		/**
		 * Erase an alarm
		 *
		 * Overridden from base
		 * @param alert the alert to undraw
		 */
		 Active911.prototype.undraw_alert=function(alert) {
		 	var alert_id = alert.get_item_value('id').toString();
		 	$('#alerts > div[alert_id="' + alert_id + '"]').remove();
		 	$(".cb-timer").timer.kill();
		 };



		/**
		 * Draw an alarm, if its alerted
		 *
		 * Overridden from base
		 * @param alert the alert to draw
		 */
		Active911.prototype.draw_alerted_alert=function(alert) {
			$("div#fullscreenAlert .A91AlertDetail").html(alert.to_detail_html());
			$("#alertModal").find(".A91Alert").after($("<div/>").addClass("cb-timer"));
			$("#alertModal").modal('show');
			$(".cb-timer").timer();
			setTimeout(function() {$("#alertModal").modal('hide');}, 60000 * settings['popup_time']);
		};

	}	// customizeActive911()


	$.afd = afd;
    $.afd.reload = reload;
    $.afd.fetchAlert = fetchAlert;
    $.afd.updateAssignments = updateAssignments;

    $.afd.active911 = active911;
    $.afd.edb = edb;
})(jQuery, moment, L);

$(document).ready(function() {
	$.afd();
});