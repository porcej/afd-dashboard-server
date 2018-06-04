/**
 * Active911Map
 *
 * Base class for implementing a map interface suitable for handling response
 * by wrapping Nokia or Google maps.
 * Requires 3rd party libraries to be loaded externally
 */

function Active911Map(param) {
	
	this.map_id="";
//	this.locations=[];					// Static list of A91Location map annotations
	this.load_rect=new A91MapRect();
	this.last_zoom_level=0;
	this.loading_locations_from_server=false;
	this._visible_locations=[];
	this._hidden_locations=[];
	this.devices=[];					// A91Device objects - people, trucks, etc. (we only care about those with recent positions).
	this.alerts=[];						// A91Alert objects (we only care about recent alarms).
	this.show_locations_on_map=true;
	$.extend(this,param);
	


/*	if (!this.locations.length) {
	
		console.log("No locations data specified!");
		return;
	}
*/	
	return this;
}


/* * PLEASE OVERRIDE THESE FUNCTIONS IN YOUR API SPECIFIC IMPLEMENTATION * */
Active911Map.prototype.add_location=function(location) {};
Active911Map.prototype.remove_location=function(location) {};
Active911Map.prototype.remove_all_locations=function(){};
Active911Map.prototype.reposition_device_marker=function(device) {};
Active911Map.prototype.remove_device_marker=function(device) {};
Active911Map.prototype.reload_device_marker=function(device) {};
Active911Map.prototype.device=function(device) {};
Active911Map.prototype.zoomlevel=function(){};
Active911Map.prototype.visible_rect=function(){};
/* * PLEASE OVERRIDE THESE FUNCTIONS IN YOUR API SPECIFIC IMPLEMENTATION * */



/**
 * The settings have changed
 * 
 * Most of the time, this means that active911.settings.map_marker_density has been updated
 * Re calculate map markers, etc
 */
Active911Map.prototype.settings_changed=function() {

		// Simulate a map movement to trigger Map Data removal or replacement, if necessary.  Start by hiding all Map Data.
		this.remove_all_locations();
        this._hidden_locations=[];
        this._visible_locations=[];

		// Now tell ourself that our last zoom level was far away
		this.last_zoom_level=0;

		// Finally, simulate a map move
		this.map_visible_rect_moved_to(this.visible_rect(),this.zoomlevel());
};


/**
 * Translate user settings into a zoomlevel cutoff for showing map data
 *
 * @retval a Google-style zoom level (integer) cutoff point
 */
Active911Map.prototype.zoomlevel_show_locations=function() {

	var _default_value=16;

	switch(active911.settings.map_marker_density){

		case "none":
			return _default_value-4;

		case "rural":
			return _default_value-2;

		case "normal":
			return _default_value;

		case "urban":
			return _default_value+2;

		case "dense_urban":
			return _default_value+4;

		default:
			active911.settings.map_marker_density="normal";
			return _default_value;
	}

};

/** 
 * The map has moved
 *
 */
Active911Map.prototype.map_visible_rect_moved_to=function(visible_rect, zoomlevel) {

	// If we are already loading data, quit now!
	if(this.loading_locations_from_server) {

		return;
	}


	// Did we just zoom farther than ZOOMLEVEL_SHOW_LOCATIONS?
    if(this.last_zoom_level >= this.zoomlevel_show_locations() && zoomlevel < this.zoomlevel_show_locations()){
        
        // Remove all locations from map and return
        console.log("Zoom too far out: hiding location icons");
        this.last_zoom_level=zoomlevel;
        this.remove_all_locations();
        this._hidden_locations=[];
        this._visible_locations=[];
        return;
    }

    // Did we just zoom closer than ZOOMLEVEL_SHOW_LOCATIONS?
    if(this.last_zoom_level < this.zoomlevel_show_locations() && zoomlevel >= this.zoomlevel_show_locations()){
        
        console.log("Zoom can now show location icons. Loading from server");
        this.last_zoom_level=zoomlevel;	
        this.fetch_locations_from_server(visible_rect, zoomlevel);
        return;
    }
    

    // Done needing to reference the last zoom level.  Update it.
    this.last_zoom_level=zoomlevel;

    // At this point, if we are beyond min zoomlevel for location markers, we don't care what happens
    if(zoomlevel < this.zoomlevel_show_locations()) {
        
        return;
    }

    // Still here?  Check hidden locations to see if any of them needs to be shown  
    var locations_to_add=[];
    for(n in this._hidden_locations){
        
    	var location=this._hidden_locations[n];

        if(visible_rect.contains_point(location.get_coordinate())) {
            
            locations_to_add.push(location);
        }
        
    }

    // Transfer locations from hidden to visible
    for(i in locations_to_add){

    	var loc=locations_to_add[i];
    	var _self=this;

    	// Remove from hidden
    	loc.remove_from(this._hidden_locations);

    	// Add to shown
    	this._visible_locations.push(loc);

    	// Show on map
       	this.add_location(loc,_self.location_clicked);

    }
    
    // Finally, check to see if we might have scrolled outside the load_rect (the area for which we have prefetched icons
    if(false==this.load_rect.contains_rect(visible_rect)){
        
        console.log("Scrolled outside the visible area.  Loading from server");
        this.fetch_locations_from_server(visible_rect, zoomlevel);
        
    }

};

/**
 * Load location data from the server
 *
 */
Active911Map.prototype.fetch_locations_from_server=function(visible_rect, zoomlevel) {


	console.log("SERVER FETCH");

	// Save these values for later
	var _visible_rect=visible_rect;
	var _zoomleve=zoomlevel;
	var _self=this;

	// Don't process map updates while loading
    this.loading_locations_from_server=true;

    var scale=Math.pow(2,(zoomlevel-this.zoomlevel_show_locations()));   // scale of load rect related to visible rect
    
    this.load_rect=visible_rect.copy_scaled_by_factor(scale);

    // Make a list of locations that are visible but outside the load_rect
    var discarded=[];
    for (i in this._visible_locations) {
        
        var location=this._visible_locations[i];

        if(false==this.load_rect.contains_location(location)) {
            
	    	this.remove_location(location);		// Remove from map
  			discarded.push(location);        	// Push to discard list
        }
    }
    
    // Remove
    for (i in discarded){

    	discarded[i].remove_from(this._visible_locations);
    }
    
	
	// Do it again, this time for hidden locations
	discarded=[];
    for (i in this._hidden_locations) {
        
        var location=this._hidden_locations[i];

        if(false==this.load_rect.contains_location(location)) {
            
  			discarded.push(location);        	// Push to discard list
        }
    }
    
    // Remove
    for (i in discarded){

    	discarded[i].remove_from(this._hidden_locations);
    }

    
    // Ask the server for more data
    active911.fetch_locations(this.load_rect, function(locations) {


   	    // Add the new locations from the server to the _hidden_locations array (if they aren't already there)
		for(i in locations) {
		
			var location=new A91Location(locations[i]);
			if(!location.contained_in(_self._hidden_locations)){

				_self._hidden_locations.push(location);
			} else {

			}

		}

		// Now check all hidden locations and display those that should be visible.  This needs to be done even if we have no new items, since the visible rect may have moved since the last time we did this.
	    var locations_to_add=[];
	    for(n in _self._hidden_locations){
	        
	    	var location=_self._hidden_locations[n];

	        if(_visible_rect.contains_point(location.get_coordinate())) {
	            
	            locations_to_add.push(location);
	        } else {


	        }
	        
	    }

	    // Transfer locations from hidden to visible
	    for(i in locations_to_add){

	    	var loc=locations_to_add[i];

	    	// Remove from hidden
	    	loc.remove_from(_self._hidden_locations);

	    	// Add to shown
	    	_self._visible_locations.push(loc);

	    	// Show on map
	       	_self.add_location(loc,_self.location_clicked);

	    }



        // Done loading!
        _self.loading_locations_from_server=false;
        

    });

    

};

/**
 * Finds a specific device
 *
 * @param device_id the device we are trying to match
 * @retval A91Device if found, or null
 */
Active911Map.prototype.get_device=function(device_id, agency_id) {

	for(i in this.devices) {
	
		if(this.devices[i].is(device_id, agency_id)) {
		
			return this.devices[i];
		}
	}
	
	return null;
};

/**
 * Finds a specific alert
 *
 * @param alert_id the ID of the alert we want
 * @retval A91Alert if found, or null
 */
Active911Map.prototype.get_alert=function(alert_id) {

	for(i in this.alerts) {
	
		if(this.alerts[i].is(alert_id)) {
		
			return this.alerts[i];
		}
	}
	
	return null;
};

/**
 * Get a device status
 *
 * @param device A91Device
 * @retval a string like "Responding: Code 3 medical 123 Easy ST
 */
Active911Map.prototype.get_device_status=function(device) {

	// We only return a response line if the response age is less than an hour
	if(device.response_age() < 3600) {
	
		// We also need to have the alert details on file
		if(alert=this.get_alert(device.get_item_value("response_specific_id"))) {
		
			return device.get_item_value("response_action")+": "+alert.get_item_value("description")+" "+alert.get_item_value("address");
			
		} else {
		
			// Can't find the alert, just return the status
			return device.get_item_value("response_action");
		
		}
	} 

	return "";
};

