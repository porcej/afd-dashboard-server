/** 
 * A91Alert
 *
 * Represents an Active911 alert
 */
A91Alert.prototype=new A91MappedDataObject();
A91Alert.prototype.constructor=A91Alert; 
function A91Alert(data) {

	this._items=[
	
		{
			"key"		:	"description",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"Alarm"
							}
		},	
		{
			"key"		:	"address",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"Address"
							}
		},
		{
			"key"		:	"place",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"Place"
							}
		},
		{
			"key"		:	"unit",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"Apt"
							}
		},
		{
			"key"		:	"city",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"City"
							}
		},
		{
			"key"		:	"cross_street",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail'],	
			"labels"	:	{
								"en-US"		:	"Cross"
							}
		},
		{
			"key"		:	"source",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail'],	
			"labels"	:	{
								"en-US"		:	"Source"
							}
		},
		{
			"key"		:	"units",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"Units"
							}
		},
		{
			"key"		:	"cad_code",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail'],	
			"labels"	:	{
								"en-US"		:	"CAD"
							}
		},
		{
			"key"		:	"map_code",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail'],	
			"labels"	:	{
								"en-US"		:	"MAP"
							}
		},
		{
			"key"		:	"id",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	['detail'],	
			"labels"	:	{
								"en-US"		:	"Active911 ID"
							}
		},
		{
			"key"		:	"details",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail'],	
			"labels"	:	{
								"en-US"		:	"Details"
							}
		},	
		{
			"key"		:	"age",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
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
		},
		{
			"key"		:	"agency_id",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:	[],	
			"labels"	:	{
								"en-US"		:	"Agency ID"
							}
		},
		{
			"key"		:	"agency_name",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"",
			"display_hints"	:	['detail','summary'],	
			"labels"	:	{
								"en-US"		:	"Agency"
							}
		},
		{
			"key"		:	"response_vocabulary",
			"type"		:	"string",
			"value"		:	null,
			"default"	:	"['Respond','Arrive','Available','Unavailable']",
			"display_hints"	:	['vocab','taxonomy'],	
			"labels"	:	{
								"en-US"		:	"Response Vocabulary"
							}
		},
		{
			"key"		:	"timestamp",
			"type"		:	"number",
			"value"		:	null,
			"default"	:	0,
			"display_hints"	:"",	
			"labels"	:	{
								"en-US"		:	"Unix Timestamp"
							}
		}
	
	
	];
	
	// Super constructor
	A91MappedDataObject.call(this, data);
	
	// Alarm age
	this._alarm_date= moment.unix(this.get_item_value("timestamp")).toDate();
	// this._alarm_date=new Date((new Date).getTime()-(this.get_item_value("age")*1000));

	this._marker_letter="?";
	return this;

}

/**
 * Get age of alert
 *
 * @retval age in seconds
 */
A91Alert.prototype.age=function() {

	return ((new Date()).getTime()-this._alarm_date.getTime())/1000;
};
 
 /**
 * Marker letter setter
 *
 * @param letter the new marker letter 
 */
A91Alert.prototype.set_marker_letter=function(letter) {

	if(typeof(letter)!="undefined"){
	
		if(typeof(letter.toString)=="function") {
		
			this._marker_letter=letter.toString();
		}
	}
};

/**
 * Marker letter getter
 *
 * @retval the marker letter 
 */
A91Alert.prototype.get_marker_letter=function() {

	return this._marker_letter;
};



 /**
 * Do we match a certain alert or alert ID?
 *
 * @param a alert or alert ID
 * @retval true|false
 */
A91Alert.prototype.is=function(a) {

	var alert_id=this.get_item_value("id");

	if(typeof(a)=="number") {
	
		return (alert_id==a);	

	} else if (typeof(a)=="object") {

		// Let the superclass do the object comparison
		return A91DataObject.prototype.is.call(this, a);
	} 
	
	return false;
};


    /* =========================================================================
    
    getUnitType - Returns the unit type as defined in str

    ========================================================================= */
    function getUnitType( str ){
        str = str || '';

        // Prepare str by removing '.', '+', and leading + trailing white
        //      space, and making everything lower case
        str = str.replace(/[\.\+]/g, '').trim().toLowerCase();

        switch (str.split(/[0-9]+/)[0]) {
            // Engines
            case 'e':
                return 'engine';
                break;

            // Trucks
            case 't':
            case 'tt':
            case 'tw':
                return 'truck';
                break;

            // EMS
            case 'a':
            case 'm':
            case 'ems':
                return 'ems';
                break;

            // Command 
            case 'bc':
            case 'ba':
            case 'so':
                return 'command';
                break;

            // Things to ignore
            case '{off roster}':
                return 'ignore';
                break;
            

            // Others
            default:
                return 'other';
        }
    }   // getUnitType()

 /**
  * Output an HTML representaiton of a parsed radio channel
  *
	* @params string call notes in string fomrat
  * @retval string containing HTML
  */
function parseRadioFromDetails(details ){
	var rawRadioChannel = details.match(/CH\:([^;]*);/gm);
	var radioChannel = '';
	
	
		if ((rawRadioChannel) && (rawRadioChannel.length >0) && (rawRadioChannel[0].length > 5 )){
			radioChannel = rawRadioChannel[0].substring(3,rawRadioChannel[0].length-1).trim();
		} else {
			// Check to see if the radio channel is the only thing in the comments
			rawRadioChannel = details.match(/CH\:([^;]+)$/gm);

			if ((rawRadioChannel) && (rawRadioChannel.length >0) && (rawRadioChannel[0].length > 3 )){
				radioChannel = rawRadioChannel[0].substring(3).trim();
			} else {
				// Check to see if we are dealing with an unknown radio channel (IE Arlington)
				rawRadioChannel = details.match(/Unknown radio channel CH([^,]+),/gm);
				if ((rawRadioChannel) && (rawRadioChannel.length >0) && (rawRadioChannel[0].length > 1 )){
					radioChannel = rawRadioChannel[0].replace("Unknown radio channel CH",'').replace(',','').trim();
				}
			}
		}
		
		if (radioChannel.length > 1 ){
			// return '<button type="button" class="btn btn-outline-warning float-right">' +
			// 			'<i class="fa fa-fw fa-bolt" aria-hidden="true"></i>&nbsp;' +
			// 			radioChannel +
			// 		'</button>';
			return '<span class="A91Alert_radio float-right">'
						+ '<i class="fa fa-fw fa-bolt" aria-hidden="true"></i>'
						+ radioChannel
						+ '</span>';
		}
	
	// Unknown radio channel CH 1B,
	return '';
	
}	// parseRadioFromDetails()

 /**
  * Output self as HTML
  *
  * @retval string containing HTML
  */
 A91Alert.prototype.to_html=function() {

 	var units = this.get_item_value("units").split(","); //getUnitType
 	var units_string = "";
	 


 	var radioChannel = '';

 	// Try to pull out the radio channel
 	if (!this.item_is_empty('details')) {
 		radioChannel = parseRadioFromDetails(this.get_item_value('details'))
 	}

 	for (var udx = 0; udx < units.length; udx++){
 		units_string += '<span class="' + getUnitType( units[udx] ) + '">' + units[udx] + '</span>';
 	}

	var dispatchTime = '<span class="float-right A91Alert_dispatchTime">'
 					+ moment.unix(this.get_item_value('timestamp')).format("HH:mm")
 					+ '</span>';

	return '<div class="A91Alert" alert_id="'+this.get_item_value("id")+'">'
		+ ((!this.item_is_empty("units"))?('<span class="A91Alert_units">'+units_string+'</span>'):"")
		+ '<h2 class="A91Alert_title">'
		+		'<span class="A91Alert_description">'+this.get_item_value("description")+'</span>'
		+		radioChannel
		+ '</h2>'
		+ ((!this.item_is_empty("place"))?('<h3 class="A91Alert_place">'+this.get_item_value("place")+'</h3>'):'')

		+ '<h3 class="A91Alert_address">'
		+	this.get_item_value("address")
		+	((!this.item_is_empty("unit"))?('<span class="A91Alert_unit">'+this.get_item_value("unit")+'</span>'):'')
		+	' <span class="A91Alert_city">'+this.get_item_value("city")+'</span>'
		+	dispatchTime
		+ '</h3>'
		// + dispatchTime
	    + '</div>';
 
 };
 
 
 /**
  * Output self as HTML details
  *
  * @retval string containing HTML
  */
 A91Alert.prototype.to_detail_html=function() {

	// Start with a nice image at the top
	// var str='<div class="A91AlertDetail" alert_id="'+this.get_item_value("id")+'"><img src="'+this.marker_image_url()+'">';


	$("div#fullscreenAlert .A91AlertDetail").attr("alert_id", this.get_item_value("id"));


 	var units = this.get_item_value("units").split(","); //getUnitType
 	var units_string = "";
 	var alerted_units = '';
 	var radioChannel = '';

 	// Try to pull out the radio channel
 	if (!this.item_is_empty('details')) {
		radioChannel = parseRadioFromDetails(this.get_item_value('details'))
 	}

 	for (var udx = 0; udx < units.length; udx++){
 		units_string += '<span class="' + getUnitType( units[udx] ) + '">' + units[udx] + '</span>';
 		if (units.length - 1 > udx){
 			units_string += "  ";
 		}

 		// Put alerted unints on the bottom of the pop-over
 		if (afdDashboardConfig['alert_units'].indexOf(units[udx]) >= 0){
			alerted_units += ' <span class="' + getUnitType( units[udx] ) + '">' + units[udx] + '</span> ';
 		}
 	}

 	if (alerted_units !== ''){
 		alerted_units = '<div class="alerted_units A91Alert_units bottom">' + alerted_units + '</div>';
 	}
 	var mapBox =  '<div class="A91Alert_mapbox">' +
 								((!this.item_is_empty('map_code'))?
										('Box: <span class="A91Alert_mapbox_val">' + 
										 	this.get_item_value('map_code')):'</span>') +
 								'</div>';

 	var crossStreets = '<div class="A91Alert_xstreet float-right">' +
							((!this.item_is_empty('cross_street'))?('X Street: <span class="A91Alert_xstreet_val">' + this.get_item_value('cross_street')) + '</span>':'') +
						'</div>';


 	var notes = '<p class="A91Alert_notes">' +
							((!this.item_is_empty('details'))?(this.get_item_value('details')):'') +
							'</p>';
	 
	 // Here we handle plottin the lat and long on the map of awesomeitude
	var lat = ((!this.item_is_empty('lat'))?(this.get_item_value("lat")):0);
	var lon = ((!this.item_is_empty('lon'))?(this.get_item_value("lon")):0);
	 
	if ((lat === 0 ) || (lon === 0)){
			$.alertMap.setZoom(13);
			$.alertMap.panTo([38.8109981,-77.0910554]);
			$.alertMap.currentCallMarker.setLatLng([lat,lon]);
			$("#alertMap").fadeTo( 5, 0.2 );
	} else {
		$("#alertMap").fadeTo( 2, 1 );
		$.alertMap.setZoom(17);
		$.alertMap.panTo([lat,lon]);
		$.alertMap.currentCallMarker.setLatLng([lat,lon]);
	}
 

	return '<div class="A91Alert" alert_id="'+this.get_item_value("id")+'">'
		+ ((!this.item_is_empty("units"))?('<span class="A91Alert_units">'+units_string+'</span>'):"")
		+'<h2 class="A91Alert_title">'
			+'<span class="A91Alert_description">'+this.get_item_value("description")+'</span>'
			+ radioChannel
		+'</h2>'
		// +radioChannel
		+((!this.item_is_empty("place"))?('<h3 class="A91Alert_place">'+this.get_item_value("place")+'</h3>'):'')
		+'<h3 class="A91Alert_address">'
			+this.get_item_value("address")
			+((!this.item_is_empty("unit"))?('<span class="A91Alert_unit">'+this.get_item_value("unit")+'</span>'):'')
			+' <span class="A91Alert_city">'+this.get_item_value("city")+'</span>'
		+'</h3>'
		+ mapBox + crossStreets + '<hr>'
		+ notes + '<hr>'
	+'</div>'
	+ ' <button type="button" class="btn btn-secondary" data-dismiss="modal">X</button>'
	+ alerted_units
	
 };

 
/**
* Return CSS selector used to get alert HTML 
*
* @retval string containing selector
*/
 A91Alert.prototype.get_html_selector=function() {
 
	return "div.A91Alert[alert_id="+this.get_item_value("id")+"]";
 
 };
 
 /**
 * Marker image URL
 *
 * @param style "large", "small"
 * @param size in pixels
 */
A91Alert.prototype.marker_image_url=function(style, size) {

	/* Todo - size is ignored */

	// Defaults
	if(typeof(style)!="string") {
			
			style="large";
	}
	
	if(typeof(size)!="number") {
	
		size="";
	}


	if(style=="large") {
	
		return Active911Config.markerfactory_uri + "?type=device&color=gray&icon_filename=icon-active911.png&text[]="+encodeURIComponent(this.get_marker_letter()+") "+this.get_item_value("description"))+"&text[]="+encodeURIComponent(this.get_item_value("address"));
	} 

	return Active911Config.markerfactory_uri + "?type=location&color=gray&text[]="+this.get_marker_letter();

};
