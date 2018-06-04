/**
 * Active911GoogleMap 
 *
 * Extends Active911Map
 * Implements a map interface suitable for handling response
 * by wrapping Google maps.
 * Requires 3rd party libraries to be loaded externally
 */
 

 Active911GoogleMap.prototype=new Active911Map();
 Active911GoogleMap.prototype.constructor=Active911GoogleMap;

/* * PLEASE OVERRIDE THESE FUNCTIONS IN YOUR API SPECIFIC IMPLEMENTATION * */
Active911GoogleMap.prototype.location_clicked=function(loc) {};
Active911GoogleMap.prototype.alert_clicked=function(alert) {};
Active911GoogleMap.prototype.clicked=function(lat, lon){};
Active911GoogleMap.prototype.map_type_changed=function(newtype){};
/* * PLEASE OVERRIDE THESE FUNCTIONS IN YOUR API SPECIFIC IMPLEMENTATION * */

function Active911GoogleMap(param) {

	// Super constructor
	Active911Map.call(this, param);
	



	// Make sure we have a map placeholder and at least one location
	if (!this.map_id) {
	
		console.log("No map placeholder specified!");
		return;
	}
	
	// Google Map MarkerImages (for reusable images)
	this._location_MarkerImages={};
	
	// Start the map, centered on the middle of all given locations
	//var center=Active911Map.prototype.average_lat_lon(this.locations);

	// Enable the visual refresh
	google.maps.visualRefresh = true;
	console.log("Zooming to "+this.zoomlevel_show_locations());
	this.map= new google.maps.Map(document.getElementById(this.map_id), {
		"zoom": this.zoomlevel_show_locations(),
		"center": new google.maps.LatLng(this.starting_lat, this.starting_lon),
		"mapTypeId": this.map_type,
		"mapTypeControlOptions": {
			"mapTypeIds": [
				google.maps.MapTypeId.ROADMAP,
				google.maps.MapTypeId.TERRAIN,
				google.maps.MapTypeId.SATELLITE,
				google.maps.MapTypeId.HYBRID,
				'night_mode'
			]
		}
	});
	
	
	/* TODO: Make night mode carry over on new alerts/assignments
	// Create an array of styles
	var styles = [
		{
			"featureType":"all",
			"elementType":"labels.text.fill",
			"stylers":[
				{
					"color":"#ffffff"
				}
			]
		},
		{
			"featureType":"all",
			"elementType":"labels.text.stroke",
			"stylers":[
				{
					"color":"#000000"
				},
				{
					"lightness":13
				}
			]
		},
		{
			"featureType":"administrative",
			"elementType":"geometry.fill",
			"stylers":[
				{
					"color":"#000000"
				}
			]
		},
		{
			"featureType":"administrative",
			"elementType":"geometry.stroke",
			"stylers":[
				{
					"color":"#144b53"
				},
				{
					"lightness":14
				},
				{
					"weight":1.4
				}
			]
		},
		{
			"featureType":"landscape",
			"elementType":"all",
			"stylers":[
				{
					"color":"#08304b"
				}
			]
		},
		{
			"featureType":"poi",
			"elementType":"geometry",
			"stylers":[
				{
					"color":"#0c4152"
				},
				{
					"lightness":5
				}
			]
		},
		{
			"featureType":"road.highway",
			"elementType":"geometry.fill",
			"stylers":[
				{
					"color":"#000000"
				}
			]
		},
		{
			"featureType":"road.highway",
			"elementType":"geometry.stroke",
			"stylers":[
				{
					"color":"#0b434f"
				},
				{
					"lightness":25
				}
			]
		},
		{
			"featureType":"road.arterial",
			"elementType":"geometry.fill",
			"stylers":[
				{
					"color":"#000000"
				}
			]
		},
		{
			"featureType":"road.arterial",
			"elementType":"geometry.stroke",
			"stylers":[
				{
					"color":"#0b3d51"
				},
				{
					"lightness":16
				}
			]
		},
		{
			"featureType":"road.local",
			"elementType":"geometry",
			"stylers":[
				{
					"color":"#000000"
				}
			]
		},
		{
			"featureType":"transit",
			"elementType":"all",
			"stylers":[
				{
					"color":"#146474"
				}
			]
		},
		{
			"featureType":"water",
			"elementType":"all",
			"stylers":[
				{
					"color":"#021019"
				}
			]
		}
	];

	// Create a new StyledMapType object, passing it the array of styles,
	// as well as the name to be displayed on the map type control.
	var styledMap = new google.maps.StyledMapType(styles,{name: "Night Mode"});
	//Associate the styled map with the MapTypeId and set it to display.
	this.map.mapTypes.set('night_mode', styledMap);
	//this.map.setMapTypeId('night_mode');
	

	google.maps.event.addListener(this.map, 'maptypeid_changed', function () {
		var agencies = $('#agencies').children();
		var device_assignments = $('.device_assignment');
		var devices = $('.A91Device');
		var assigns = $('.A91Assignment');
		var alerts = $('#alerts').children();
		if(active911.map.map.mapTypeId == 'night_mode') {
			// Night view
			$('#right_sidebar').addClass('right_sidebar_dark');
			$('#right_sidebar').removeClass('right_sidebar_light');
			$('#right_toggle_button').children().css('background-color', 'black');
			$('#left_toggle_button').children().css('background-color', 'black');
			$('#left_sidebar').addClass('left_sidebar_dark');
			$('#left_sidebar').removeClass('left_sidebar_light');
			$('#client_area').css('background-color', 'black');
			for(var i = 0; i < agencies.length; i++) {
				$(agencies[i]).addClass('A91Agency_dark');
				$(agencies[i]).removeClass('A91Agency_light');
			}
			for(var i = 0; i < assigns.length; i++) {
				$(assigns[i]).removeClass('ui-widget-content');
			}
			for(var i = 0; i < device_assignments.length; i++) {
				$(device_assignments[i]).addClass('device_assignment_dark');
				$(device_assignments[i]).removeClass('device_assignment_light');
			}
			for(var i = 0; i < devices.length; i++) {
				$(devices[i]).addClass('A91Device_dark');
				$(devices[i]).removeClass('A91Device_light');
			}
			for(var i = 0; i < alerts.length; i++) {
				$(alerts[i]).addClass('A91Alert_dark');
				$(alerts[i]).removeClass('A91Alert_light');
			}
		} else {
			// Regular view
			$('#right_sidebar').removeClass('right_sidebar_dark');
			$('#right_sidebar').addClass('right_sidebar_light');
			$('#right_toggle_button').children().css('background-color', 'white');
			$('#left_toggle_button').children().css('background-color', 'white');
			$('#left_sidebar').addClass('left_sidebar_light');
			$('#left_sidebar').removeClass('left_sidebar_dark');
			$('#client_area').css('background-color', 'white');
			for(var i = 0; i < agencies.length; i++) {
				$(agencies[i]).addClass('A91Agency_light');
				$(agencies[i]).removeClass('A91Agency_dark');
			}
			for(var i = 0; i < assigns.length; i++) {
				$(assigns[i]).addClass('ui-widget-content');
			}
			for(var i = 0; i < device_assignments.length; i++) {
				$(device_assignments[i]).addClass('device_assignment_light');
				$(device_assignments[i]).removeClass('device_assignment_dark');
			}
			for(var i = 0; i < devices.length; i++) {
				$(devices[i]).addClass('A91Device_light');
				$(devices[i]).removeClass('A91Device_dark');
			}
			for(var i = 0; i < alerts.length; i++) {
				$(alerts[i]).addClass('A91Alert_light');
				$(alerts[i]).removeClass('A91Alert_dark');
			}
		}
	});
	*/

	var _typechanged=this.map_type_changed;
	google.maps.event.addListener(this.map, 'maptypeid_changed', function () {
		_typechanged(active911.map.map.mapTypeId);
	});

	// When someone clicks on the map, wait a few ms (to trap doubleclick) then fire the .clicked handler
	var _clicked_timer=null;
	var _clicked=this.clicked;
	google.maps.event.addListener(this.map,"click",function(event){

		var _lat=event.latLng.lat();
		var _lon=event.latLng.lng();

		// Don't proceed if we already have a timer going...
		if(_clicked_timer) {

			window.clearTimeout(_clicked_timer);
			_clicked_timer=null;
			return;
		}

		_clicked_timer=window.setTimeout(function() {

			_clicked_timer=null;
			_clicked(_lat, _lon);
		},300);

		return false;
	});

	// Double cancels the click timer (so we don't fire .clicked on doubleclick)
	google.maps.event.addListener(this.map,"dblclick",function(event){

		if(_clicked_timer) {

			window.clearTimeout(_clicked_timer);
			_clicked_timer=null;
		}

		return false;
	});

	// When the bounds of the map have changed, load new markers from the server
	var _me=this;
	google.maps.event.addListener(this.map,"idle",function(event){

		var bounds=active911.map.map.getBounds();
		var ne=new A91MapCoordinate(bounds.getNorthEast().lat(),bounds.getNorthEast().lng());
		var sw=new A91MapCoordinate(bounds.getSouthWest().lat(),bounds.getSouthWest().lng());
		var rect=new A91MapRect(ne,	sw);


		_me.map_visible_rect_moved_to(rect, active911.map.map.getZoom());
	
		return false;
	});

										
	// Add all locations to the map	
/*	for(i in this.locations) {
	
		var loc=this.locations[i];
		this.add_location(loc, this.location_clicked);
	}
*/	

}


/** 
 * Return the current visible rect
 *
 * @retval visible rect (A91MapRect)
 */
Active911GoogleMap.prototype.visible_rect=function(){


		var bounds=active911.map.map.getBounds();	
		var ne=new A91MapCoordinate(bounds.getNorthEast().lat(),bounds.getNorthEast().lng());
		var sw=new A91MapCoordinate(bounds.getSouthWest().lat(),bounds.getSouthWest().lng());
		return new A91MapRect(ne,	sw);
};

/** 
 * Return the current zoomlevel
 *
 * @retval zoomlevel (number)
 */
Active911GoogleMap.prototype.zoomlevel=function(){

		return active911.map.map.getZoom();
};


/**
 * Add a location marker to the map
 *
 *
 * @param A91Location
 * @retval
 */
Active911GoogleMap.prototype.add_location=function(loc, callback) {

	var _location=loc;

	// Create a Google marker
	var marker=new google.maps.Marker({
							"position"		:		new google.maps.LatLng(loc.get_lat(),loc.get_lon()),
							"map"			:		this.map,
							"title"			:		loc.get_item_value("name"),
							"icon"			:		this.get_location_MarkerImage(loc)
							});
	
	// Make marker clickable
	google.maps.event.addListener(marker, 'click', function(e) {
	
		// Click event recenters map, fires overridable event
		//this.map.setCenter(e.latLng);
		callback(_location);			
	});

	// Set the map marker in the location
	loc.set_map_marker(marker);


};


/**
 * Remove a location from the map
 *
 */
Active911GoogleMap.prototype.remove_location=function(location) {

	// Get marker
	var marker=location.get_map_marker();

	// Clear marker from map
	marker.setMap(null);
	location.set_map_marker(null);	

};

/**
 * Remove all locations from the map
 *
 */
Active911GoogleMap.prototype.remove_all_locations=function() {

	// Iterate all locations, removing each marker
	for(n in this._visible_locations){

		// Get marker
		var loc=this._visible_locations[n];
		var marker=loc.get_map_marker();

		// Clear marker from map
		marker.setMap(null);
		loc.set_map_marker(null);	
	}

};
 
/**
 * Remove alarm marker from map
 *
 * @param loc A91Location
 * @retval google.maps.MarkerImage
 */
Active911GoogleMap.prototype.get_location_MarkerImage=function(loc) {



	if(typeof(this._location_MarkerImages[loc.icon_class()]) != "undefined") {
	
		return this._location_MarkerImages[loc.icon_class()];
	}
	
	// Not found.  Create a new one.
	var marker=new google.maps.MarkerImage(

		loc.marker_image_url(48),
		new google.maps.Size(37,48),	// Size
		new google.maps.Point(0,0),		// Origin
		new google.maps.Point(18,39)	// Anchor
	);
	
	this._location_MarkerImages[loc.icon_class()]=marker;
	
	return marker;
};

/**
 * Remove alarm marker from map
 *
 * @param A91Alert
 */
 Active911GoogleMap.prototype.remove_alert=function(alert) {
 
 	// Does this alert exist in our list of markers?  If so, destroy the marker and remove the item
	for (i in this.alerts) {
	
		if(this.alerts[i].is(alert)) {
		
			// Remove marker from map
			var marker=this.alerts[i].get_map_marker();
			if(marker!=null) {

				marker.setMap(null);	
			}
			
			// Destroy marker, and remove alert from our array
			this.alerts[i].set_map_marker(null);			
			this.alerts.splice(i,1);			
			break;
		}
	}
 
 };

/**
 * An alarm has occurred, or an alarm has changed
 *
 * @param recenter_map boolean should we recenter the map?
 * @param A91Alert
 * @param recenter_map boolean whether the map should fly to the new alert location
 */
 Active911GoogleMap.prototype.alert=function(alert,recenter_map) {
 
	// If we don't have a lat/lon, we can't map it 
	if(alert.get_item_value("lat")==0 || alert.get_item_value("lon")==0) {
	
		return;
	}
 
	// Remove alert if it already exists
	this.remove_alert(alert);
	
	// Create marker image.  New alerts get a full text box, old ones get a small marker
	if(alert.get_item_value("age") < (24*3600)) {

		// Full text box
		marker_image=new google.maps.MarkerImage(
									alert.marker_image_url("large",96),
									new google.maps.Size(250,96),	// Size
									new google.maps.Point(0,0),		// Origin
									new google.maps.Point(39,78)	// Anchor
									);
	} else {
	
		// Small bubble marker
		marker_image=new google.maps.MarkerImage(
									alert.marker_image_url("small",96),
									new google.maps.Size(75,96),	// Size
									new google.maps.Point(0,0),		// Origin
									new google.maps.Point(37,78)	// Anchor
									);
	}
	
	alert.set_map_marker(new google.maps.Marker({
							"position"		:		new google.maps.LatLng(alert.get_lat(),alert.get_lon()),
							"map"			:		this.map,
							//"title"			:		alert.name,
							"icon"			:		marker_image
							}));
								
	// Save internally
	this.alerts.push(alert);
	
	// Add an event handler
	var callback=this.alert_clicked;
	google.maps.event.addListener(alert.get_map_marker(), 'click', function(e) {
		
			// Click event recenters map, fires overridable event
			//this.map.setCenter(e.latLng);
			callback(alert);			
	});

	
	// Recenter map
	if(typeof recenter_map!="undefined" && recenter_map) {
	
		this.map.panTo(new google.maps.LatLng(alert.get_item_value("lat"),alert.get_item_value("lon")));
	}
	
 };

/**
 * Add a device to our records
 *
 * @param A91Device
 */
 Active911GoogleMap.prototype.device=function(device) {
 
	// Is this a new device?
	if(null==this.get_device(device.get_item_value("id"), device.get_item_value("agency_id"))) {
	
		// Yes. Save it. Is position < 6 minutes old? 
		this.devices.push(device);
		if(device.position_age() < 360) {
		
			// Yes.  Can we find an alert for it's last response?
			var alert=this.get_alert(device.get_item_value("response_specific_id"));
			if(alert) {
			
				// Yes.  We found it.  Does the alert agency match this device's agency?
				if(alert.get_item_value("agency_id")==device.get_item_value("agency_id")) {
					
					// Reload the marker
					this.reload_device_marker(device);
				
				} else {
				
					// Right device, wrong incarnation.  Wait for another device with same ID but different agency ID.
				}
			
			} else {

				// Just reload the marker with this device, since we don't know if this is the right incarnation or not
				this.reload_device_marker(device);
			}
		}

	} else {
	
		console.log("Active911GoogleMap.device() called with existing device");
	
	}
 };

 
/**
 * Move a device marker
 *
 * If not already displayed, creates a new marker
 * @param A91Device we are displaying
 */
Active911GoogleMap.prototype.reposition_device_marker=function(device) {
 
	// If not yet showing, just display it
 	if(!device.get_map_marker()) {
	
		return this.reload_device_marker(device);
	}
	
	// Already showing, so move it
	device.get_map_marker().setPosition( new google.maps.LatLng(device.get_lat(), device.get_lon()));
 }
 
/**
 * Remove a device from the map
 *
 * @param A91Device we are removing
 */
Active911GoogleMap.prototype.remove_device_marker=function(device) {
 
	if(device.get_map_marker()) {

		device.get_map_marker().setMap(null);	// Remove marker from map
		device.set_map_marker(null);			// Destroy marker completely
	}
}

/**
 * (re) display a device on the map
 *
 * If already displayed, kills the old marker
 * @param A91Device we are displaying
 */
Active911GoogleMap.prototype.reload_device_marker=function(device) {
 
	// There may be multiple incarnations of this device.  If so, we want to reload only the newest one and hide all others.
	var d=device,
		oldest_membership;
  
	this.devices = active911.devices;
	// Iterate all devices
	for (i in this.devices) {
	
		// Found a device with a matching ID
		if(this.devices[i].is(device.get_item_value("id"))) {

			// Remove it from the map
			if(this.devices[i].get_map_marker()) {
			
				this.remove_device_marker(this.devices[i]);
			}
			
			// If it is newer, it becomes the new candidate for display
			if(this.devices[i].age() < d.age()) {
			
				d=this.devices[i];
			}
		}
	}
	
	// We only display devices that have a recent position
	if(d.position_age() >= 360){
		
		return;
	}
	
	//Check to make sure we want to show this device based on the "Show watch devices" setting
	if(active911.settings.show_watch_devices != "on" && active911.settings.show_watch_devices != "map_only"){
		return;
	}
	
	// Make sure the icon is from the oldest agency memebership
	for (i in this.devices) {
		if(this.devices[i].is(d.get_item_value("id")) &&
				this.devices[i].get_item_value("agency_id") > d.get_item_value("agency_id")) {
			d = this.devices[i];
		}
	}
	
	// Create a new image
	var scale=0.75;
	var marker_image=new google.maps.MarkerImage(
								d.marker_image_url(Math.round(96*scale),this.get_device_status(d)),
								new google.maps.Size(Math.round(250*scale),Math.round(96*scale)),	// Size
								new google.maps.Point(0,0),		// Origin
								new google.maps.Point(Math.round(39*scale),Math.round(78*scale))	// Anchor
								);	

	
	// Create a new marker
	d.set_map_marker(new google.maps.Marker({
							"position"		:		new google.maps.LatLng(d.get_lat(),d.get_lon()),
							"map"			:		this.map,
							"icon"			:		marker_image,
							"clickable"		:		false
							}));
							
 
 };
