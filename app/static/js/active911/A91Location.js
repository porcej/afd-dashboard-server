/**
 * A91Location
 *
 * Represents a location on a map
 * May contain data on associated resources
 */
A91Location.prototype=new A91MappedDataObject();
A91Location.prototype.constructor=A91Location;  
function A91Location(data) {

	this._items=[
		{
			"key"		:	"id",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	[],	
			"labels"	:	{}
		},		
		{
			"key"		:	"icon_filename",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	[],	
			"labels"	:	{}
		},	
		{
			"key"		:	"icon_color",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"red",
			"display_hints"	:	[],	
			"labels"	:	{}
		},	
		{
			"key"		:	"name",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"Name"
							}
		},
		{
			"key"		:	"description",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"Description"
							}
		},	
		{
			"key"		:	"resources",
			"type"		:	"array",
			"value"		:	null,
			"default"	:	[],
			"display_hints"	:	[],	
			"labels"	:	{}
		},
		{
			"key"		:	"lat",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	[],	
			"labels"	:	{
								"en-US"		:	"Latitude"
							}
		},
		{
			"key"		:	"lon",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	[],	
			"labels"	:	{
								"en-US"		:	"Latitude"
							}
		}
	];

	// Super constructor
	A91MappedDataObject.call(this, data);
	this._map_marker=null;
	return this;
}

 /**
 * Do we match a certain alert or alert ID?
 *
 * @param a alert or alert ID
 * @retval true|false
 */
A91Location.prototype.is=function(a) {

	var alert_id=this.get_item_value("id");

	if(typeof(a)=="number") {
	
		return (alert_id==a);	

	} else if (typeof(a)=="object") {

		// Let the superclass do the object comparison
		return A91DataObject.prototype.is.call(this, a);
	} 
	
	return false;
};

/**
 * Return position as A91MapPoint
 *
 * @retval point
 */
A91Location.prototype.get_coordinate=function() {

	return new A91MapCoordinate(this.get_item_value("lat"), this.get_item_value("lon"));

};

/** 
 * Get a class name for this icon class
 * 
 * The returned class name will be identical across all icons 
 * that have identical marker images.  The idea is to identify
 * icons that can be reused across multiple markers.
 *
 * @retval a string that is unique to a particular marker appearance (color, etc)
 */
A91Location.prototype.icon_class=function() {

	return this.get_item_value("icon_color")+":"+this.get_item_value("icon_filename");

};

/**
 * Map marker setter
 *
 * @param marker the new map marker 
 */
A91Location.prototype.set_map_marker=function(o) {

	this._map_marker=o;
};

/**
 * Map marker getter
 *
 * @retval the map marker
 */
A91Location.prototype.get_map_marker=function() {

	return this._map_marker;
};

 /**
 * Marker image URL
 *
 * @param size in pixels
 */
A91Location.prototype.marker_image_url=function(size) {

	var size_text="";
	if(typeof(size)=="number") {
	
		size_text="&height="+size;
	}

	return Active911Config.markerfactory_uri + "?type=location&color="+this.get_item_value("icon_color")+"&icon_filename="+this.get_item_value("icon_filename")+size_text;

};

 /**
  * Output self as HTML details
  *
  * @retval string containing HTML
  */
 A91Location.prototype.to_html=function() {

	// Start with a nice image at the top
	var str='<div class="A91Location" location_id="'+this.get_item_value("id")+'"><img src="'+this.marker_image_url()+'">'
				+'<span class="A91Location_name paragraph-title">'+this.get_item_value("name")+'</span>'
				+'<span class="A91Location_description .normal-text">'+this.get_item_value("description")+'</span>'
				+'<div class="A91Location_resources">';

	// Resources go here
	var resources=this.get_item_value("resources");
	if(resources.length) {
	
		str	+='<table>'
	
		for (var i in resources) {
		
			str+='<tr>'
					+'<td class="left-column">'
						+'<a class="A91Location_resource_title subtext-title" href="' + Active911Config.access_uri + '?operation=get_resource&resource_id='+resources[i].id+'" target="_new">'+resources[i].title+'</a>'
						+'<div class="A91Location_resource_details subtext">'+resources[i].details+'</div>'
					+'</td>'
					+'<td class="right-column">'
						+'<div class="A91Location_resource_specs light-text">'+resources[i].extension.toString().toUpperCase()+' - '+Math.round(resources[i].size/1000)+'k</div>'
					+'</td>'
				+'</tr>';
		}

		str+="</table>";
	}

	str			+='</div>'
			+'</div>';
	
	return str;
 };