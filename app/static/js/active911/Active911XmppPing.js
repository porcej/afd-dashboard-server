/**
 * Active911XmppPing
 *
 * Tracks a XMPP ping (XEP 199)
 */
 
function Active911XmppPing(param) {

	// Default settings
	var settings={
	
		"id"					:	0,
		"timestamp"				:	0,
		"success"				:	function(){ console.log("Ping id="+settings.id+" OK ("+settings.latency+"ms)"); },
		"failure"				:	function(){ console.log("Ping id="+settings.id+" TIMEOUT"); },
		"timeout"				:	5000,
		"latency"				:	-1
	};
	
	$.extend(settings,param);


	// Setup timeout
	var timeoutref=setTimeout(failure,settings.timeout);


	/**
	 * Check to see if we match a received ping
	 *
	 */
	 this.matches_received_id=function(ping_id) {
	 
		if(ping_id==settings.id) {
	 
			return true;
		}
		
		return false;
	 };
	 
	 /**
	  * Ping complete
	  *
	  */
	 this.complete=function(){
	 
		settings.latency=(new Date().getTime() - settings.timestamp);
		clearTimeout(timeoutref);
		settings.success();
	 };
	 
	 
	/**
	 * Timer expired, ping incomplete
	 *
	 */
	 function failure() {
		
		// Reset the success handler, so it is not called even if this ping comes in later
		settings.success=function(){};
	 
		// Call the failure handler
		settings.failure();
	 
	 }
}