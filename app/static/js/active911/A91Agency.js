/**
 * A91Agency.js
 *
 * Represents an Active911 department
 */
A91Agency.prototype = new A91DataObject();
A91Agency.prototype.constructor = A91DataObject();

function A91Agency(data){

  this._items=[

  {
    "key":"lat",
    "type":"number",
    "value":null,
    "default":0,
    "display_hints":[],
    "labels":{
      "en-US":"lat"
    }
  },
  {
    "key":"lon",
    "type":"number",
    "value":null,
    "default":0,
    "display_hints":[],
    "labels":{
      "en-US":"lon"
    }
  },
    {
      "key" : "agency_id",
      "type" : "number",
      "value" : null,
      "default" : 0,
      "display_hints" : [],
      "labels" : {
        "en-US": "Agency ID"
      }
    },
    {
      "key" : "name",
      "type" : "string",
      "value" : null,
      "default": "",
      "display_hints" : [],
      "labels": {
        "en-US": "Name"
      }
    },
      {
        "key":"assignments",
        "type":"array",
        "value":[],
        "default":[],
        "display_hints": [],
        "labels": {
          "en-US":"assignments"
        }
      },
      {
        "key":"capabilities",
        "type":"string",
        "value":null,
        "default":"",
        "display_hints":[],
        "labels":{
          "en-US":"capabilities"
        }
      },
        {
          "key":"pagegroups",
          "type":"array",
          "value":[],
          "default":[],
          "display_hints":[],
          "labels":{
            "en-US":"pagegroups"
          }
        }
  ];

  // Call super constructor, load data
  A91DataObject.call(this,data);

	// Add a settings area
	this.settings = {};
	this.settings.current_assignment_id = 0;
	this.settings.show_agency = true;
	this.settings.hide_empty_assignments = true;
}


/**
 * Convenience name getter
 *
 * @retval the name
 */
A91Agency.prototype.get_name = function(){

  return this.get_item_value("name");
};

/**
 * Convenience name setter
 *
 * @param the name
 */
A91Agency.prototype.set_name = function (name){

  this.set_item_value("name",name);
};

/**
 * Convenience id getter
 *
 * @retval the id
 */
A91Agency.prototype.get_agency_id = function(){

  return this.get_item_value("agency_id");
};

/**
 * Convenience id setter
 *
 * @param the id
 */
A91Agency.prototype.set_agency_id = function(agency_id){

  this.set_item_value("agency_id",agency_id);
};

/**
 * Convenience assignments getter
 *
 * @retval the assignments
 */
A91Agency.prototype.get_assignments = function(){

  return this.get_item_value("assignments");
};

/**
 * Convenience assignments setter
 *
 * @param the assignments
 */
A91Agency.prototype.set_assignments = function(assignments){

  this.set_item_value("assignments",assignments);
};

/**
 * Output self as HTML
 *
 * @retval string containing HTML
 */
A91Agency.prototype.to_html = function(){

	var assignments = this.get_assignments();
	
	var assignments_html="";
	var assigments_selector = "";

/*	for (i in assignments){

		// Output each assigment with a container for devices
		assignments_html += '<div class="ui-widget ui-widget-content ui-state-normal ui-corner-all A91Assignment" assignment_id="'+assignments[i].id+'">'
			+'<span>'+assignments[i].title+'</span>'
			+'<div class="A91Assignment_devices"></div></div>';
		
	};
*/
  return '<div class="ui-widget ui-widget-content ui-state-normal ui-corner-all A91Agency" agency_id="'+this.get_agency_id()+'">'
    +'<span class="A91Agency_x" agency_id="'+this.get_agency_id()+'"><a href="#">hide</a></span>'
    +'<span class="A91Agency_name"><h2>'+this.get_name()+'</h2>'
		+'<span class="devices_state" agency_id="'+this.get_agency_id()+'">Change Assignment:</span>' 
		+'<span class="change_assignment_area">'
		+'<select class="device_assignment" agency_id="'+this.get_agency_id()+'"></select>'
		+'<div class="ui-corner-all active911-blue-button ui-button update_assignment" role="button" agency_id="'+this.get_agency_id()+'">Update</div>'
		+'</span>'
		+'</span>'
    +'<div class="A91Agency_assignments" agency_id="'+this.get_agency_id()+'"></div>'
		+'</div>'
	//		+assignments_html
  //  +'</div>'
  //  +'</div>'
};

/**
 * Return CSS selector used to get the Agency HTML
 *
 * @retval string containing CSS selector
 */
A91Agency.prototype.get_html_selector = function(){

	return "div.A91Agency[agency_id="+this.get_agency_id()+"]";
};












