 /**
  * Active911
  *
  * Use as singleton
  * Used for storing data, piping events, etc
  */
function Active911(params) {

	$.extend(this,
		$.extend(
			{
				"local_time_offset_msec"   :  0,                           // Time difference between local and server (local - server = offset)
				"settings"                 :  {
					"max_alarms"               :  5,                           // Max alarms to display
					"language"                 :  'en-US',
					"map_marker_density"       :  "normal",
					"alarm_autoremove_age"     :  4*3600,
					"auto_scroll"              :  "new_alert",
					"show_watch_devices"       :  "on",
					"silent_alarms"            :  "toned",
					"alarm_sidebar"            :  "show",
					"status_sidebar"           :  "show",
					"auto_recover"             :  "on"
				},
				"gps"                      :  {},
				"live"                     :  false,
				"timer_controller"         :  false, // new TimerController(),
				"startup_delay"            :  2,
				"alerts"                   :  [],                           // A91Alert[]
			}, params));


	this.current_marker_letter="A";


}


/* * PLEASE OVERRIDE THESE FUNCTIONS IN YOUR API SPECIFIC IMPLEMENTATION * */
Active911.prototype.draw_alert=function(alert) {};
Active911.prototype.draw_alerted_alert=function(alert) {};
Active911.prototype.undraw_alert=function(alert) {};

/* * PLEASE OVERRIDE THESE FUNCTIONS IN YOUR API SPECIFIC IMPLEMENTATION * */

Active911.prototype.cull_old_alerts=function() {

	// Make a list of alerts to remove
	var alerts_to_remove=[];
	for (var i in this.alerts) {

		var alert=this.alerts[i];
		if(alert.age() > this.settings.alarm_autoremove_age) {
			console.log("Alert age: "+alert.age() + " > "+this.settings.alarm_autoremove_age);
			//this.remove_alert(alert);
			alerts_to_remove.push(alert);
		}
	}

	// Remove them
	for (i in alerts_to_remove){

		this.remove_alert(alerts_to_remove[i]);
	}
};

/**
 * Get a setting
 *
 * @param setting
 * @retval the value
 */
Active911.prototype.get_setting=function(setting) {

	return this.settings[setting];	/* Todo - make this more judicious */

};

/**
 * Change a setting
 *
 * NB if the setting does not exist (i.e., there is no default) we don't change it
 * @param setting	the setting to change
 * @param value		the new value
 * @retval the value
 */
Active911.prototype.set_setting=function(setting,value) {

	if(typeof(this.settings[setting])=="undefined") {

		return;
	}

	this.settings[setting]=value;

};


/**
 * Calculate the server time offset
 *
 * In case the local computer clock is off, we use the server time for all calcs
 * @param unix_timestamp current time (UTC, in seconds since Unix epoch)
 */
Active911.prototype.set_server_time=function(unix_timestamp) {

	this.local_time_offset_msec=(new Date()).getTime()-(new Date(unix_timestamp*1000)).getTime();
};


/**
 * Return a current Date object
 *
 * In case the local computer clock is off, this function will return a Date corresponding to current server time
 */
Active911.prototype.ServerDate=function() {

	return new Date(new Date((new Date()).getTime()-this.local_time_offset_msec));

};
/**
 * Remove an alert from the webview
 *
 * @param alert the alert to remove
 */
Active911.prototype.remove_alert=function(alert) {

	console.log("Removing alarm: " +alert.description);

	// Remove from screen
	this.undraw_alert(alert);

	// Remove from array
	for(i in this.alerts) {

		if(this.alerts[i].is(alert)) {

			this.alerts.splice(i,1);
			return;
		}
	}

}

/**
 * Add an alert
 *
 * Adds to the local data, draws on screen
 * @param alert A91Alert
 * @param initializing boolean true if we are initialiaing state
 */
Active911.prototype.add_alert=function(alert, initializing) {
	
	// Assume we are not initilized unless specifically told we are 
	//		inilizling
	initializing = initializing || false;

	var alert_id = alert.get_item_value("id");
	
	// Add to array
	console.log("Adding alarm: " +alert.get_item_value("description"));
	
	this.alerts.push(alert);
	
	
	// Draw alert on screen
	this.draw_alert(alert);

	// Consider Alerting on this alert
	if (!initializing) {	/* We only want to alert if we are not loading old alerts */

		/* We always want to alert if always_alert is true */
		if (afdDashboardConfig['always_alert']){
			this.draw_alerted_alert(alert)
		}

		var units = alert.get_item_value("units").split(",");
	 	for (var udx = 0; udx < units.length; udx++){
 	
	 		// Put alerted unints on the bottom of the pop-over
	 		if (afdDashboardConfig['alert_units'].indexOf(units[udx]) >= 0){
	 			console.log('='.repeat(80));
	 			console.log('='.repeat(80));
	 			console.log("*\t ALERTING ON " + units[udx] + " for incident #" + alert.get_item_value('cad_code') + ".");
	 			console.log('='.repeat(80));
	 			console.log('='.repeat(80));
				this.draw_alerted_alert(alert);
				break;
	 		}
 		}
	}

    // console.log(afdDashboardConfig);


		// if (alerted_units) {
	// if (afdDashboardConfig['always_alert']) {
	// 	$("div#fullscreenAlert .A91AlertDetail").html(alert.to_detail_html());
	// 	$("#alertModal").modal('show');
	// 	setTimeout(function() {$("#alertModal").modal('hide');}, 60000 * 2);
	// }	/* At somepoint we should really make this a config settings */
	
	// Pop-up an alert if we are not initializing
	// if ((!initializing) && alert.item_is_empty('units')){
	// 	var station209Units = ['209', 'M202', '259', '231'];
 // 		var alerted_units = false;
	// 	var units = alert.get_item_value('units').split(","); //getUnitType
		
	// 	// Check if we have any units to alert
	// 	// for (var adx = 0; adx < station209Units.length; adx++){
 // 	// 		if( units[udx].indexOf(station209Units[adx]) >= 0){
 // 	// 			alerted_units = true;
 // 	// 		}
 // 	// 	}
		


		

	// }
	

// 	//If the alert has been already added, remove it first
// 	var old_alert = this.get_alert(alert_id);
// 	//Before removing the alert, we need the responses
// 	var old_responses;

// 	if(old_alert !== null){
		
// 		// Store the old alerts response data
// 		old_responses = jQuery(".A91Alert[alert_id='" + alert_id + "'] .A91Alert_response").children();
// 		this.remove_alert(old_alert);
// 	}

// 	// Add to array
// 	console.log("Adding alarm: " +alert.get_item_value("description"));
// // 	alert.set_marker_letter(this.current_marker_letter);
// 	this.alerts.push(alert);

// 	// Draw on screen
// 	this.draw_alert(alert);

// 	// Append the old response data
// // 	$(".A91Alert[alert_id='"+alert_id+"'] .A91Alert_response").append(old_responses);
// 	console.log(old_responses);

	// Increment marker letter (A -> B -> ... Y -> Z -> A)
// 	this.current_marker_letter=(String.fromCharCode(this.current_marker_letter.charCodeAt(0)+1));
// 	if(this.current_marker_letter=="[") {	// [ is next after Z

// 		this.current_marker_letter="A";
// 	}

};

/**
 * Finds a specific alert
 *
 * @param alert_id the alert_id
 * @retval A91Alert if found, or null
 */
Active911.prototype.get_alert=function(alert_id) {

	for(var i in this.alerts) {

		if(this.alerts[i].is(alert_id)) {

			return this.alerts[i];
		}
	}

	return null;
};













