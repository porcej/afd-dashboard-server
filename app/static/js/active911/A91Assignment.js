/**
 * A91Assignment
 *
 * Represents a Data Object that will appear on the map, but may or may not have GPS coordinates.
 */
A91Assignment.prototype = new A91DataObject();
A91Assignment.prototype.constructor = A91Assignment;
function A91Assignment(data) {
	
	this._items = [
	{
		"key"	:	"id",
		"type"	:	"string",
		"value"	:	null,
		"default"	:	"",
		"display_hints"	:	[],
		"labels"	:	{}
	},
	{
		"key"	:	"agency_id",
		"type"	:	"number",
		"value"	:	null,
		"default"	:	0,
		"display_hints"	:	[],
		"labels"	:	{}
	},
	{
		"key"	: "description",
		"type"	:	"string",
		"value"	:	null,
		"default"	:	"",
		"display_hints"	:	[],
		"labels"	:	{}
	},
	{
		"key"	:	"location_id",
		"type"	:	"number",
		"value"	:	null,
		"default"	:	0,
		"display_hints"	:	[],
		"labels"	:	{}
	},
	{
		"key"	:	"title",
		"type"	:	"string",
		"value"	:	null,
		"default"	:	"",
		"display_hints"	:	[],
		"labels"	:	{}
	},
	{
		"key"	:	"lat",
		"type"	:	"number",
		"value"	:	null,
		"default"	:	0,
		"display_hints"	:	[],
		"labels"	:	{
			"en-US"	:	"Latitude"	
		}
	},
	{
		"key"	:	"lon",
		"type"	:	"number",
		"value"	:	null,
		"default"	:	0,
		"display_hints"	:	[],
		"labels"	:	{
			"en-US"	:	"Longitude"
		}
	},
	{
		"key" : "archived",
		"type" : "boolean",
		"value" : "null",
		"default": false,
		"display_hints" : [],
		"labels" : {
		 "en-US" : "archived"
		}
	}
	];

	A91DataObject.call(this, data);

};

/**
 * Convenience title getter
 *
 * @retval the title
 */
A91Assignment.prototype.get_title = function(){

	return this.get_item_value("title");
};

/**
 * Convenience id getter
 *
 * @retval the id
 */
A91Assignment.prototype.get_id = function(){

	return this.get_item_value("id");
};

/**
 * Convenience agency_id getter
 *
 * @retval the agency_id
 */
A91Assignment.prototype.get_agency_id = function(){

	return this.get_item_value("agency_id");
};

/**
 * Output self as html
 *
 * @param string containing html
 */
A91Assignment.prototype.to_html = function(){

	str = '<div class="ui-widget ui-widget-content ui-state-normal ui-corner-all A91Assignment" assignment_id="'+this.get_id()+'" agency_id="'+this.get_agency_id()+'" title="'+this.get_title().toLowerCase()+'">'
			+'<span>'+this.get_title()+'</span>'
			+'<div class="A91Assignment_devices"></div>'
		+'</div>'

		return str;

};

A91Assignment.prototype.to_select_list = function(){

	title = this.get_title();

	// Id of zero means we are using the Auto assigment
	if (this.get_id() == 0){
	
		title = 'Auto';
	};

	str = '<option class"ui-button ui-widget ui-state-default ui-button-text-only ui-state-active device_assignment_option" agency_id="'+this.get_agency_id()+'" value="'+this.get_id()+'" label="'+title+'">'+this.get_id()+'</option>';
	
	return str;

};

/**
 * Return CSS selector used to get the Assignment HTML
 *
 * @retval string containing CSS selector
 */
A91Assignment.prototype.get_html_selector = function(){

	return "div.A91Assignment[assignment_id="+this.get_id()+"][agency_id="+this.get_agency_id()+"]";
};

A91Assignment.prototype.in_array =  function(a){

	for (var i in a){
	
		var item = a[i];

		if ((item.get_id() == this.get_id())&&(item.get_agency_id() == this.get_agency_id())){
		
			return true;
		}
	}
	return false;
};

























