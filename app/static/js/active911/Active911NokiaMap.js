/**
 * Active911NokiaMap 
 *
 * Extends Active911Map
 * Implements a map interface suitable for handling response
 * by wrapping Nokia maps.
 * Requires 3rd party libraries to be loaded externally
 */
 
 function Active911NokiaMap(param) {
	
	// Super constructor
	Active911Map.call(this, param);
	this.nokia_app_id="MeyzpTXlgPeIhQmcvni1";
	this.nokia_token="xt8MFJ39VFUieYtUBpyayQ";
	this.markers=[];							// Nokia markers

	
	// Start the map, centered on the middle of all given locations
	var center=Active911Map.prototype.average_lat_lon(this.locations);
	nokia.Settings.set( "appId", this.nokia_app_id);
    nokia.Settings.set( "authenticationToken", this.nokia_token);

	var map=new nokia.maps.map.Display(document.getElementById(this.map_id), {
										"zoomLevel"		:	13,
										"center"		:	new nokia.maps.geo.Coordinate(center.lat, center.lon),
										"components"	:	[
																new nokia.maps.map.component.ZoomBar(), 
																new nokia.maps.map.component.Behavior(),			// Panning/zooming
																new nokia.maps.map.component.TypeSelector(),		// Satellite vs street, etc
																new nokia.maps.map.component.Traffic(),				// Allow traffic toggle
																new nokia.maps.map.component.DistanceMeasurement(),		
																new nokia.maps.map.component.Overview(),			// Mini map in corner
																new nokia.maps.map.component.ScaleBar(),			
																/*new nokia.maps.positioning.component.Positioning(),	// Will show "Map to my GPS position" thingie */
																new nokia.maps.map.component.ContextMenu()			// Right click / long press context menu
															]
										});
										
	// Add all locations to the map	
	for(i in this.locations) {
	
		this.markers.push(new nokia.maps.map.StandardMarker(new nokia.maps.geo.Coordinate(this.locations[i].lat,this.locations[i].lon)));
	}
	map.objects.addAll(this.markers);
	

}

/**
 * An alarm has occurred, or an alarm has changed
 *
 * @param A91Alert
 */
 Active911NokiaMap.prototype.alert=function(o) {
 
 
 };

/**
 * A device has updated in some way
 *
 * @param A91Device
 */
 Active911NokiaMap.prototype.device=function(o) {
 
 
 };
