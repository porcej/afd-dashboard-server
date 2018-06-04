
/**
 * A91MapCoordinate
 *
 * Handles map coordinate
 * @param parameters object
 */

function A91MapCoordinate(lat, lon) {


	// Define defaults	
	this.lat=(typeof(lat)=='number')?lat:0;
	this.lon=(typeof(lon)=='number')?lon:0;
	
	return this;
}

A91MapCoordinate.prototype.copy=function() {

	var c=new A91MapCoordinate();

	c.lat=this.lat;
	c.lon=this.lon;

	return c;
};


/**
 * A91MapRect
 *
 * Handles map rects
 */

function A91MapRect(ne, sw) {
	

	this.northeast=(typeof(ne)=='object' && ne instanceof A91MapCoordinate)?ne:(new A91MapCoordinate());
	this.southwest=(typeof(sw)=='object' && sw instanceof A91MapCoordinate)?sw:(new A91MapCoordinate());

	return this;
}

/**
 * Set center, size
 *
 * @param center the center of the rect (A91MapCoordinate)
 * @param sw the size of the rect (A91MapCoordinate)
 */
A91MapRect.prototype.init_with_center_size=function(center, size) {

	if(center instanceof A91MapCoordinate && size instanceof A91MapCoordinate){

		var _ne=new A91MapRect(center.lat+( Math.abs(size.lat) /2),center.lon+( Math.abs(size.lon) /2));
		var _sw=new A91MapRect(center.lat-( Math.abs(size.lat) /2),center.lon-( Math.abs(size.lon) /2));

		this.northeast=this.convert_to_signed(_ne);
		this.southwest=this.convert_to_signed(_sw);

		return this;
	}

	throw("Argument not an instance of A91MapCoordinate");
};


/**
 * Get center
 *
 * @retval (A91MapCoordinate) center
 */
A91MapRect.prototype.center=function() {

	// Get SW in unsigned coords
	var sw=this.convert_to_unsigned(this.southwest);

	// Get size
	var size=this.size().copy();

	// Center is half the size, plus the SW corner
	sw.lat+=(size.lat/2.0);
	sw.lon+=(size.lon/2.0);

	return this.convert_to_signed(sw);

};

/**
 * Get size
 *
 * @retval (A91MapCoordinate) size
 */
A91MapRect.prototype.size=function() {

	var ne=this.convert_to_unsigned(this.northeast);
	var sw=this.convert_to_unsigned(this.southwest);

	return new A91MapCoordinate(Math.abs(ne.lat-sw.lat),Math.abs(ne.lon-sw.lon));

};

/**
 * Do we contain a point?
 *
 * @param (A91MapCoordinate) point
 * @retval bool
 */
A91MapRect.prototype.contains_point=function(point) {

	if(point instanceof A91MapCoordinate){

		// Get distance from center and size
		var distance_from_center=this.degrees_from(this.center(),point);
		var size=this.size();

		return (Math.abs(distance_from_center.lat) < size.lat/2.0 && Math.abs(distance_from_center.lon) < size.lon/2.0);

	}

	throw("Not an instance of A91MapCoordinate");
};

/**
 * Do we contain a location?
 *
 * @param (A91Location) location
 * @retval bool
 */
A91MapRect.prototype.contains_location=function(location) {

	if(location instanceof A91Location){

		return (this.contains_point(new A91MapCoordinate(location.get_lat(),location.get_lon())));

	}
	
	throw("Not an instance of A91Location");
};


/**
 * Do we contain another rect?
 *
 * @param (A91MapRect) rect
 * @retval bool
 */
A91MapRect.prototype.contains_rect=function(rect) {

if(rect instanceof A91MapRect){

		return (this.contains_point(rect.northeast) && this.contains_point(rect.southwest));

	}
	
	throw("Not an instance of A91MapRect");
};


/**
 * Point subtraction
 *
 * @param (A91MapCoordinate) point1 
 * @param (A91MapCoordinate) point2 
 * @retval (A91MapCoordinate) the difference
 */
A91MapRect.prototype.degrees_from=function(point1, point2) {


	if(point1 instanceof A91MapCoordinate && point2 instanceof A91MapCoordinate) {


		// Convert to unsigned
		p1=this.convert_to_unsigned(point1);
		p2=this.convert_to_unsigned(point2);


		// Difference
		var difference=new A91MapCoordinate(p2.lat-p1.lat,p2.lon-p1.lon);

	    // Normalize (from 10 to 350 should be -20, not 340
	    if(difference.lon > 180) {
	        
	        difference.lon-=360;
	    }
	    if(difference.lat > 180) {
	        
	        difference.lat-=360;
	    }
	    
	    return difference;


	}

	throw("Not an instance of A91MapCoordinate");

};

/**
 * Scale rect by a scale factor, retaining the center
 *
 * @param factor the scale factor
 * @retval (A91MapRect) the scaled rec
 */
A91MapRect.prototype.copy_scaled_by_factor=function(factor) {

    var size=this.size().copy();
    size.lat*=factor;
    size.lon*=factor;
    
    var center=this.convert_to_unsigned(this.center());


    return new A91MapRect(

		this.convert_to_signed(new A91MapCoordinate(center.lat+(size.lat/2.0),	center.lon+(size.lon/2.0))),

		this.convert_to_signed(new A91MapCoordinate(center.lat-(size.lat/2.0),	center.lon-(size.lon/2.0)))
	);

};

/**
 * Convert point to unsigned
 *
 * @param (A91MapCoordinate) point
 * @retval (A91MapCoordinate) a new point, like the first but unsigned
 */
A91MapRect.prototype.convert_to_unsigned=function(point) {

	if(point instanceof A91MapCoordinate){

		var p=point.copy();

		p.lat=this.convert_lat_to_unsigned_degrees(p.lat);
		p.lon=this.convert_lon_to_unsigned_degrees(p.lon);
		return p;

	}

	throw("Not an instance of A91MapCoordinate");

};



/**
 * Convert point to signed
 *
 * @param (A91MapCoordinate) point
 * @retval (A91MapCoordinate) a new point, like the first but signed
 */
A91MapRect.prototype.convert_to_signed=function(point) {

	if(point instanceof A91MapCoordinate){

		var p=point.copy();

		p.lat=this.convert_lat_to_signed_degrees(p.lat);
		p.lon=this.convert_lon_to_signed_degrees(p.lon);
		return p;

	}

	throw("Not an instance of A91MapCoordinate");

};

/**
 * Convert a longitude on [-180..180] to [0..360]
 *
 * This is useful for comparison operations.  Without conversion, points
 * near 180 degrees may not be properly compared
 *
 * @param lon on [-180..180]
 * @retval lon on [0..360]
 */
A91MapRect.prototype.convert_lon_to_unsigned_degrees=function(lon) {

    if(lon > 180 || lon < -180){
        
        // It ain't pretty
        throw("convertLatToUnsignedDegrees: input out of bounds");
    }

    return lon+180.0;

};

/**
 * Convert a latitude on [-90..90] to [0..180]
 *
 * This is useful for comparison operations.  Without conversion, points
 * near 90 degrees may not be properly compared
 *
 * In unsigned degrees, -90 (south pole) becomes 0.  45 N latitude becomes 135, etc
 *
 * @param lat on [-90..90]
 * @retval lon on [0..180]
 */
A91MapRect.prototype.convert_lat_to_unsigned_degrees=function(lat) {

  if(lat > 90 || lat < -90){
        
        // It ain't pretty
        throw("convertLatToUnsignedDegrees: input out of bounds");
    }
    
    return lat+90.0;

};


/**
 * Convert unsigned longitude to [-180..180]
 *
 * Safe for unbounded (>360 etc) values
 * @param lon the unsigned value
 * @retval a longitude on [-180..180]
 */
 A91MapRect.prototype.convert_lon_to_signed_degrees=function(lon) {

    // Convert input to [0..360]
    while (lon > 360) {
        
        lon-=360;
    }
    while (lon < 0) {
        
        lon+=360;
    }
    
    // Convert to signed
    return lon-180;

 };

 /**
 * Convert unsigned latitude to [-90..90]
 *
 * Safe for unbounded (>180 etc) values
 * @param lat the unsigned value
 * @retval a latitude on [-90..90]
 */
 A91MapRect.prototype.convert_lat_to_signed_degrees=function(lat) {

// Convert input to [0..180]
    while (lat > 180) {
        
        lat-=180;
    }
    while (lat < 0) {
        
        lat+=180;
    }
    
    // Convert to signed
    return lat-90;

};