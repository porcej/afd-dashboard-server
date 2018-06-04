/**
 * A91Device
 *
 * Represents a device
 */

// Constants
A91Device.prototype.COMPARISON={
									"POSITION_CHANGED"	:	1,
									"RESPONSE_CHANGED"	:	2
								};
A91Device.prototype=new A91MappedDataObject();
A91Device.prototype.constructor=A91Device; 
function A91Device(data) {

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
			"key"		:	"agency_id",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	[],	
			"labels"	:	{}
		},
		{
			"key"	:	"assignment_id",
			"type" : "string",
			"value" : null,
			"default" : "",
			"display_hints" : [],
			"labels" : {}
		},
		{
			"key"	:	"assignment_override",
			"type"	:	"boolean",
			"value"	:	null,
			"default"	:	null,
			"display_hints"	:	[],
			"labels":	{}
		},
		{
			"key"		:	"response_specific_id",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	[],	
			"labels"	:	{}
		},
		{
			"key"		:	"response_stamp",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	[],	
			"labels"	:	{}
		},
		{
			"key"		:	"position_stamp",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	[],	
			"labels"	:	{}
		},
		{
			"key"		:	"name",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"Untitled Device",
			"display_hints"	:	[],	
			"labels"	:	{
								"en-US"		:	"Name"
							}
		},
		{
			"key"		:	"response_action",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"none",
			"display_hints"	:	[],	
			"labels"	:	{
								"en-US"		:	"Response"
							}
		},
		{
			"key"		:	"icon_filename",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"icon-person.png",
			"display_hints"	:	[],	
			"labels"	:	{}
		},	
		{
			"key"		:	"icon_color",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"orange",
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
	
	// Set Date objects for the position and response
	this._position_date=new Date(this.get_item_value("position_stamp")*1000);		// Server time 
	this._response_date=new Date(this.get_item_value("response_stamp")*1000);

	return this;
}


 /**
  * Output self as HTML
  *
  * @retval string containing HTML
  */
 A91Device.prototype.to_html=function() {
 
	str='<div class="ui-widget ui-state-normal A91Device" device_id="'+this.get_item_value("id")+'" agency_id="'+this.get_item_value("agency_id")+'">'
			+'<div class="A91Device_name">'+this.get_item_value("name")+'</div>'
			+'<div class="A91Device_action">'+this.get_item_value("response_action")+'</div>'
		+'</div>';
 
	return str;
 };

	/**
	 * Output self as assignment status HTML
	 *
	 * @retval string containing HTML
	 */
	A91Device.prototype.to_assignment_html=function(){

	str='<div class="ui-widget ui-state-normal A91Device" device_id="'+this.get_item_value("id")+'" agency_id="'+this.get_item_value("agency_id")+'" name="'+this.get_item_value("name")+'">'
			+'<div class="A91Device_name">'+this.get_item_value("name")+'</div>'
				+'<div class="A91Device_assignment_status_info">'
					+'<div class="A91Device_assignment_action">'+this.get_item_value("response_action")+'</div>'
				+'</div>'
		+'</div>';
 
	return str;
	}

	/**
	 * Return the CSS selector used to get the assignment HTML
	 *
	 * @retval string containing the selector
	 */
	A91Device.prototype.get_assignment_html_selector=function(){
	
		return ".A91Agency_assignments div.A91Device[device_id='"+this.get_item_value("id")+"'][agency_id="+this.get_item_value("agency_id")+"]";
	};

/**
 * Do we match a certain device membership?
 *
 * @param device_id
 * @param agency_id (optional)
 * @retval true|false
 */
A91Device.prototype.is=function(device, agency) {

	// If we are passed an actual device object, just compare objects
	if(typeof(device)=="object") {

		return A91DataObject.prototype.is.call(this, device);
	}

	// If we were passed two numbers
	if(typeof(device) == "number" && typeof(agency) == "number") {
	
		return (this.get_item_value("id")==device && this.get_item_value("agency_id")==agency);	
	}
	
	// If we were passed one number
	if(typeof(device)=="number") {
		
		return (this.get_item_value("id")==device);	
	}
	
	// Default
	return false;
};


/**
 * Update device position
 *
 * @param lat the new latitude
 * @param lon the new longitude
 * @retval 1 if we changed anything, 0 if nothing was changed
 */
A91Device.prototype.set_position=function(lat,lon) {

	// Is anything actually changing?
	if(this.get_item_value("lat")==lat && this.get_item_value("lon")==lon) {
	
		// Don't update the lat and lon, but do update the position
		this._position_date=active911.ServerDate();
		return 0;
	}

	this.set_lat(lat);
	this.set_lon(lon);
	this._position_date=active911.ServerDate(); /* HACK - needs setter*/
	return 1;
};

/**
 * Update the device assignment
 *
 * @param the agency_id of the changing assignment
 * @param the assignment_id of the new assignment
 */
A91Device.prototype.set_assignment=function(agency_id,assignment_id) {

	// If a device is reporting an assignment shorter than 16 characters, append zero to make it a proper hex string
	if(assignment_id.length < 16){
	
		while(assignment_id.length < 16){
		console.log("adding zeroes");		
		assignment_id = "0"+assignment_id;
		}
	}

	this.set_item_value("assignment_id",assignment_id);
};

/**
 * Get the device assignment
 * @param the agency_id of the assignment
 *
 * @retval the assignment id
 */
A91Device.prototype.get_assignment = function() {

	return this.get_item_value("assignment_id");
};

/**
 * Get the device's latest response action
 *
 * @retval the reponse action
 */
A91Device.prototype.get_response_action = function() {

	return this.get_item_value("response_action");
};

/**
 * Update device response
 *
 * @param agency_id the ID of the agency owning this alarm/response
 * @param alert_id the alert to which we are responding
 * @param action 'respond', 'cancel', etc
 * @param lon the new longitude
 */
A91Device.prototype.set_response=function(alert_id, action) {

	this.set_item_value("response_specific_id",alert_id);
	this.set_item_value("response_action",action);
	this._response_date=active911.ServerDate();	/* HACK - needs setter*/
};

/**
 * Get seconds since last update
 *
 * @retval time in seconds since last update
 */
A91Device.prototype.age=function() {

	return Math.min(this.position_age(), this.response_age());
};


/**
 * Get seconds since last position update
 *
 * @retval time in seconds since last position update
 */
A91Device.prototype.position_age=function() {

	return ((active911.ServerDate()).getTime()-this._position_date.getTime())/1000;
};


/**
 * Get seconds since last response update
 *
 * @retval time in seconds since last response update
 */
A91Device.prototype.response_age=function() {

	return ((active911.ServerDate()).getTime()-this._response_date.getTime())/1000;
};

/**
 * Marker image URL
 *
 * @param style "large", "small"
 * @param size in pixels
 */
A91Device.prototype.marker_image_url=function(size,status) {

	var size_text="";
	if(typeof(size)=="number") {
	
		size_text="&height="+size;
	}
	
	return Active911Config.markerfactory_uri + "?type=device&color="+this.get_item_value("icon_color")+"&icon_filename="+encodeURIComponent(this.get_item_value("icon_filename"))+"&text[]="+encodeURIComponent(this.get_item_value("name"))+"&text[]="+encodeURIComponent(status)+size_text;

};
