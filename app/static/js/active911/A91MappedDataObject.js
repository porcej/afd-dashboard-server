/** 
 * A91MappedDataObject
 *
 * Represents an Data Object that will appear on a map
 * We requre at least a "lat" and "lon" data item, and we add a map marker holder
 */
A91MappedDataObject.prototype=new A91DataObject();
A91MappedDataObject.prototype.constructor=A91MappedDataObject; 
function A91MappedDataObject(data) {

	// Make sure our items at least contain a lat and lon
	var lat= {
		"key"		:	"lat",
		"type"		:	"number",
		"value"		:	null,
		"default"	:	0,
		"display_hints"	:	[],	
		"labels"	:	{
							"en-US"		:	"Latitude"
						}
	};
	var lon={
		"key"		:	"lon",
		"type"		:	"number",
		"value"		:	null,
		"default"	:	0,
		"display_hints"	:	[],	
		"labels"	:	{
							"en-US"		:	"Latitude"
						}
	};

	if(typeof(this._items)=="undefined") {
		this._items=[];
	}
	
	if(this._get_item("lat")==null) {
	
		this._items.push(lat);
	}

	if(this._get_item("lon")==null) {
	
		this._items.push(lon);
	}

	// Call super constructor, load data
	A91DataObject.call(this, data);

	this._map_marker=null;

}

/**
 * Convenience latitude getter
 *
 * @retval the latitude
 */
A91MappedDataObject.prototype.get_lat=function() {

	return this.get_item_value("lat");
};

/**
 * Convenience latitude setter
 *
 * @param lat the latitude
 */
A91MappedDataObject.prototype.set_lat=function(lat) {

	this.set_item_value("lat",lat);
};

/**
 * Convenience longitude getter
 *
 * @retval the longitude
 */
A91MappedDataObject.prototype.get_lon=function() {

	return this.get_item_value("lon");
};

/**
 * Convenience longitude setter
 *
 * @param lon the longitude
 */
A91MappedDataObject.prototype.set_lon=function(lon) {

	this.set_item_value("lon",lon);
};

/**
 * Map marker setter
 *
 * @param marker the new map marker 
 */
A91MappedDataObject.prototype.set_map_marker=function(o) {

	this._map_marker=o;
};

/**
 * Map marker getter
 *
 * @retval the map marker
 */
A91MappedDataObject.prototype.get_map_marker=function() {

	return this._map_marker;
};
