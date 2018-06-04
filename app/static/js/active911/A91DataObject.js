/** 
 * A91DataObject
 *
 * Base class for data classes to override
 * The pattern here is that we are trying to wrap data (typically JSON objects)
 * in type-specific classes that provide getters, setters, operators, and other
 * sanity-inducing constructs.  
 * For this reason, this object and its decendants are typically called with at 
 * least one parameter: The data that they are wrapping.
 */
function A91DataObject(data) {

	// Sample items.  Define your own when you override.
	if(typeof(this._items)=="undefined") {
		this._items=[

		/* Sample item */
		/* It might be clever to load this from a server */
		/*
			{
				"key"			:	"user_name",						// Key used by getters, setters, etc
				"type"			:	"string",							// string|array|number|boolean|object|function
				"value"			:	null,								// Value will be stored here
				"default"		:	"john.doe@acme.com",				// Default, or null for no default
				"display_hints"	:	['detail','summary'],				// Semi-arbitrary list of hints describing what views should display this item
				"labels"		:	{									// Labels for this key, with IETF language tag
									"en-US"		:	"Username",		
									"es"		:	"Nombre de cuenta"
								}
			}
		*/
		];
	}
	
	// Try to set our items from the passed data
	if(typeof(data)=="object") {
		for(var i in this._items) {

			var item=this._items[i];
			if(typeof(data[item.key])!="undefined") {
			
				this.set_item_value(item.key, data[item.key]);
			}
		}
	}
	
	return this;
}

/**
 * Equality operator
 *
 * @param object
 * @retval boolean
 */
A91DataObject.prototype.is=function(o) {

	if(typeof(o)=="undefined") {
	
		return false;
	}
	
	return (this==o);
};



 /**
  * Output self as HTML details
  *
  * @retval string containing HTML
  */
 A91DataObject.prototype.to_detail_html=function() {
 
	var str='<dl>';
	
	for (var i in this._items) {
		
		if(this._items[i].display_hints.indexOf('detail') >= 0) {
			
			str+=((!this.item_is_empty(this._items[i].key))?('<dt>'+this.get_item_label(this._items[i].key,active911.settings.language)+'</dt><dd>'+this.get_item_value(this._items[i].key)+'</dd>'):'');
		}
	}
	str+='</dl>';

	return str;
 };


/** 
 * Find an item in the items list (PRIVATE)
 *
 * @param key
 * @retval the item stanza, or null
 */
A91DataObject.prototype._get_item=function(key) {

	for(var i in this._items) {
	
		var item=this._items[i];
		if(item.key==key) {
			
			return item;
		}
	}

	return null;
};

/** 
 * Get a safe blank value for a given data type (PRIVATE)
 *
 * @param type (string|number|array|boolean|function|object) 
 * @retval a blank new object of that type, or "" if undefined/unknown
 */
A91DataObject.prototype._get_blank=function(type) {

	// Default type is a String
	if(typeof(type)=="undefined") {
	
		type="string";
	}

	switch(type.toLowerCase()){
	
	case "number":
		return 0;
		break;
		
	case "array":
		return [];
		break;
		
	case "boolean":
		return false;
		break;

	case "object":
		return {};
		break;

	case "function":
		return function(){};
		break;
	
	case "string":
	default:
		return "";
	}

	return "";
};


/**
 * See if an item is "properly" defined
 *
 * For an item value to be properly_defined, it has to be a non-null value
 * of the appropriate type (as defined in the _items object)
 * @param key the item key
 * @retval boolean
 */
A91DataObject.prototype.item_value_properly_defined=function(key) {

	// Find the item
	var item=this._get_item(key);
	if(item==null) {
			
		return false;
	}	
	
	// Make sure the type is right (we do the double typeof because we designate an extra type, 'array', that is not primitive)
	if(typeof(item.value) == typeof(this._get_blank(item.type))) {
	
		return true;
	}
	
	return false;
};

/**
 * See if an item is empty
 *
 * @param key the item key
 * @retval false if (item exists && value defined && value nonblank), otherwise true
 */
A91DataObject.prototype.item_is_empty=function(key) {

	// Find the item
	var item=this._get_item(key);
	if(item!=null) {					// Item exists
			
		if(this.item_value_properly_defined(key)) {	// Item value is proper type

			var blank=this._get_blank(item.type);
			if(item.value!=blank) {					// Item != blank value
				
				return false;
			}
		}
	}	
	
	return true;
};

/**
 * Check if an item value exists in the key
 *
 * @param key
 * @param value
 *
 * @retval boolean
 */
A91DataObject.prototype.item_value_equals=function(key,value){

	// Find the item
	var item=this._get_item(key);
	
	if(item!=null){		// Item exists
	
		if(this.item_value_properly_defined(key)){	// Item must be typed correctly
		
			if (this.get_item_value(key) == value){		// Item equals value we are looking for
				
				return true;
			} else {
				
				return false;
			}
		}
	}
}

/**
 * Get an item value
 *
 * Returns a safe value for this item.  For example, if we request a "name",
 * and "name" is supposed to be a String, we will return "" if name is undefined
 *
 * @param key the item key
 * @retval the item, OR the default value of this item, or a blank value
 */
A91DataObject.prototype.get_item_value=function(key) {

	// Find the item
	var item=this._get_item(key);
	if(item==null) {
			
		return "";		// Not found
	}	

	// Is this item properly defined?
	if(!this.item_value_properly_defined(key)) {
	
		// No. Return default if possible
		var blank=this._get_blank(item.type);
		if(typeof(item.default) == typeof(blank)) {
		
			return item.default
		};
		
		// No. And no default.  Return blank.
		return blank;
	}

	// Return value
	return item.value;
};


/**
 * Item value setter
 *
 * @param key the item key to set
 * @param value the value to set
 */
A91DataObject.prototype.set_item_value=function(key, value) {

	// Find the item
	var item=this._get_item(key);
	if(item==null) {
			
		return;
	}	
	
	// Find a blank value for this item
	var blank=this._get_blank(item.type);
	
	// We were passed a null value.  Unset.
	if (value==null) {
	
		item.value=blank;
		return;
	}

	// Set value, if type matches
	if(typeof(value)==typeof(blank)) {
	
		item.value=value;
		return;
	}

	// If item is a string, try to do a conversion
	if(typeof(blank)=="string") {
	
		if(typeof(value.toString)=="function") {
	
			item.value=value.toString();
			return;
		}
	}
	
	// If item is a number, try to do a conversion
	if(typeof(blank)=="number") {
	
		if(typeof(value)=="string") {
		
			item.value=parseFloat(value);
			return;
		}
	}

	// No known conversion.  Set to blank
	item.value=blank;
};


/**
 * Return language/locale specific label
 *
 * @param ietf the language code to search for ("en-US", "en", "es", etc)
 * @retval the appropriate label, OR the key itself if none is defined/found
 */
A91DataObject.prototype.get_item_label=function(key, ietf) {

	// Find the item
	var item=this._get_item(key);
	if(item==null) {
			
		return key;
	}

	// See if there is a matching ietf translation
	if(typeof(item.labels[ietf])=="string") {
	
		return item.labels[ietf];
	}

	// Get the ISO 639 code from ietf tag (for "en-US", this would be "en") and try again
	if(ietf.contains("-")) {
	
		var iso639=(ietf.split("-"))[0];
		if(typeof(item.labels[iso639])=="string") {
		
			return item.labels[iso639];
		}		
	}
	
	// Default: return key
	return key;
};


/**
 * Are we contained in a given array?
 *
 * @param array the array in question
 * @retval true|false
 */
A91DataObject.prototype.contained_in=function(a){ 

	for (i in a) { 

		var item=a[i];
		if(typeof(item)=='object' && typeof(item.is)=='function' && a[i].is(this)){

			return true; 
		}
	}

 	return false;
};


/**
 * Remove ourself from an array
 *
 * Only removes the first instance from an array
 *
 * @param array the array in question
 * @retval true if the array was modified, false otherwise
 */
A91DataObject.prototype.remove_from=function(a){ 

	for (i in a) { 

		var item=a[i];
		if(typeof(item)=='object' && typeof(item.is)=='function' && a[i].is(this)){

			a.splice(i,1); 
			return true;
		}
	}
	
	return false;
};




