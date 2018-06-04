/**
 * Active911 GPS
 * 
 * Uniform wrapper for browser geolocation
 * @param callback the function to call when position changes
 * @param desired_precision in meters 
 * @param max_interval the maximum amount of time to wait, in seconds, between callback calls (even if nothing changes)	(resolution ~10s)
 * @param min_interval the minimum amount of time to wait, in seconds, between callback calls 	
 */
function Active911GPS(callback, desired_precision, max_interval, min_interval) {

	this.lat=0;
	this.lon=0;
	this.error=100000;
	this.supported=false;
	this.method="html5";
	
	this._callback=callback;
	this._desired_precision=this.check_value(desired_precision, 10000, 10, 10);		// "change" means position different by (default 10m)
	this._max_interval=this.check_value(max_interval, 10000, 30, 300);				// Update at least every 300 seconds (5 minutes)
	this._min_interval=this.check_value(min_interval, 10000, 5, 5);				// Update no sooner than every 5 seconds
	this._last_update=null;
	this._timer1=null;
	this._timer2=null;
	
	// Make sure callback is null or a function
	if (typeof(this._callback) != "function") {
	
		this._callback=null;
	}
	
	// First choice: GpsGate
	if(typeof(GpsGate) != 'undefined') {

		if (typeof(GpsGate.Client)!='undefined') {
		
			this.method="gpsgate";
			this.supported=true;
		}	
	}
	
	// Second choice: HTML5 Geolocation
	if(!this.supported) {
	
		try{
		
			if(navigator.geolocation) {
			
				this.method="html5";
				this.supported=true;
			}
			
		} catch(e) {
		
		};
	}
	
	if(!this.supported) {

		return this;
		console.log("Active911GPS: Geolocation is not supported");
	}
	
	// Add first loop... check position every _min_interval seconds
	(function(self) {

		self._timer1=setInterval(function() {
		
			self.get_location();
		
		}, 1000*self._min_interval);
		
	})(this);

	// Second loop reports position at least every max_interval seconds
	if(this._max_interval>=5) {

		(function(self) {
		
			self._timer2=setInterval(function() {
			
				if(self._last_update) {
				
					if(((new Date()).getTime()-self._last_update.getTime()) >= (1000*self._max_interval)){

						self._last_update=new Date();
						self._callback(self.get_coordinates());
					}
				}
			}, 10000);
			
		})(this);
	
	}

	return this;
}

/**
 * Kill the GPS system
 *
 */
 /*
Active911GPS.prototype.kill=function() {

	if(this._timer1) {
	
		clearInterval(this._timer1);
	}

	if(this._timer2) {
	
		clearInterval(this._timer2);
	}

};
*/
/**
 * Return a sane numerical value within bounds
 *
 * @param val the value we are looking at
 * @param upper the upper bounds for this value
 * @param lower the lower bounds for this value
 * @param def the default value for this value
 * @retval val, or upper or lower, or default
 */
Active911GPS.prototype.check_value=function(val, upper, lower, def){

	if(typeof(val)=="number") {
	
		if(val > upper) {
		
			return upper;
		}
		
		if (val < lower) {
		
			return lower;
		}
	
		return val;
	
	}
	
	return def;
};

/** 
 * Haversine
 * 
 * Estimates distances (meters) based on two lat/lon pairs
 * @param lat1 1st latitude, degrees
 * @param lon1 2nd latitude, degrees
 * @param lat2 etc
 * @param lon2 etc
 * @retval distance in meters between the two points
 */
Active911GPS.prototype.haversine=function(lat1, lon1, lat2, lon2) {

	// Radius of earth
	var R= 6731000; 	// meters
	
	// Central angle
	var dLat=(lat2-lat1)*(Math.PI/180);
	var dLon=(lon2-lon1)*(Math.PI/180);
	
	// Convert lats to radians
	var lat1=lat1*(Math.PI/180);
	var lat2=lat2*(Math.PI/180);

	// Magic
	var a=Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
	var c=2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	
	return R * c;
};

/** 
 * Coordinates setter (PRIVATE)
 *
 * If the coords change by more than specified values, we perform callbacks etc
 *
 * @param lat the latitude
 * @param lon the longitude
 * @param error the error
 */
Active911GPS.prototype._set_coordinates=function(lat, lon, error){

	// Clean values
	var lat=parseFloat(lat);
	var lon=parseFloat(lon);
	var error=parseFloat(error);

	// Do we need to call the callback based on this change?
	if(this.haversine(this.lat, this.lon, lat, lon) >= this._desired_precision) {
	
		this.lat=lat;
		this.lon=lon;
		this.error=error;

		// Call callback, with new values
		this._last_update=new Date();
		this._callback(this.get_coordinates());
		return;
	}

	// No call necessary.  Don't set values either (we only set when they change >= precision)
};

/** 
 * Coordinates getter
 *
 * @retval [lat, lon, error]
 */
Active911GPS.prototype.get_coordinates=function(){

	return {
			"lat"	:	this.lat,
			"lon"	:	this.lon,
			"error"	:	this.error
			};
};


/**
 * Get GPS location
 *
 * Called by internal timer. 
 */
Active911GPS.prototype.get_location=function() {

		
	var self=this;

	if(!this.supported) {
	
		// Not supported
		return;
	}
		
	
	switch(this.method) {
	
	case "gpsgate":
		GpsGate.Client.getGpsInfo(function(gps){
			
			if(gps.status.valid && gps.status.permitted) {
			
				// We don't really know the error of the device.  We "guess" error from HDOP - see http://www.developerfusion.com/article/4652/writing-your-own-gps-applications-part-2/3/
				self._set_coordinates.call(self, gps.trackPoint.position.latitude, gps.trackPoint.position.longitude, 6*gps.trackPoint.precision.hdop);
			}
		});
		break;
		
	case "html5":
		navigator.geolocation.getCurrentPosition(function(position) { 

			self._set_coordinates.call(self, position.coords.latitude, position.coords.longitude, position.coords.accuracy);

		});
		break;
	}

};


/**
 * Display position in decimal format
 *
 * @retval string "45.01, -123.2"
 */
Active911GPS.prototype.toString=function() {

	return this.lat+", "+this.lon;

}