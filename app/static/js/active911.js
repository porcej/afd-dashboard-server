
/***

jQuery Active 911

An lite-weight api wrapper for Active 911
Copyright 2017 Joseph Porcelli
0.0.2

***/


(function ($, moment) {
    'use strict';

    var active_settings = {
            url: '//alert.porcej.com',           // alert.porcej.com end point
            targetElement: ".cb-active911",      // Target HTML Element
            // updateResolution: 900000,         // # of ms between time updates
            updateResolution: 60000,             // # of ms between time updates
                                                 //    900000 -> 15 min
            credFunc: function(){return "";},   // function to get credentials
    };


    /* =========================================================================
    
    webstaff - lets do some majic

    ========================================================================= */
    function active911( settings ){
        
        var sKeys = Object.keys(settings);
        for (var sdx in sKeys){
            var sKey = sKeys[sdx];
            if (active_settings.hasOwnProperty(sKey)){
                if (sKey == 'credFunc'){
                    updateCreds( settings[sKey] );
                } else {
                    active_settings[sKey] = settings[sKey];
                }
            }
        }


        scaffoldActive911();
        // go(creds, filter);
        fetchData();
        
        return this;    // we support chaining
    }   // webstaff()





    /* =========================================================================
    
    getKeys - returns the keys in object

    ========================================================================= */
    function getKeys(obj){
        var keys = [];
        for(var key in obj){
            if (obj.hasOwnProperty(key)){
                keys.push(key);
            }
        }
        return keys;
    }   // getKeys()


    /* =========================================================================
    
    isFunction - Checks to see if object is a function

    ========================================================================= */
    function isFunction(object) {
        return typeof(object) === 'function';
    }   // isFunction()


    /* =========================================================================
    
    isArray - Checks to see if object is an array

    ========================================================================= */
    function isArray(object) {
        return (object.constructor == Array);

    }   // isArray()


    /* =========================================================================
    
    updateCreds - Sets the creds

    ===========================_============================================= */
    function updateCreds( credFunction ){
        if (isFunction(credFunction)){
            active_settings.credFunc = credFunction;
        }
    }   // updateCreds()



    /* =========================================================================
    
    fetchData - Gets roster data

    ========================================================================= */
    function fetchData(date){
        date = date || '';

        $.ajax({
            type : 'POST',
            url  : active_settings.url,
            data : active_settings.credFunc() +'&end=250',
            dataType : 'json',
            success: function(json, textStatus, request){
                for (var adx=0; adx < json.length; adx++){
                    var alert_class = '.a911-alert-' + adx.toString() +' .al-';
                    $(alert_class + 'title').text(json[adx].description)
                    var location = json[adx].address;
                    if (json[adx].unit){
                        location += ' #' + json[adx].unit.toString();
                    }
                    location += ', ' + json[adx].city + '(' + json[adx].map_code.toString() +')';
                    $(alert_class + 'loc').html(location);
                }
            },
            error: function(xhr, ajaxOpts, thrownError){
                console.log("Response Error: ", xhr.status);
            }
        });
    }   // fetchData()


    /* =========================================================================
    
    scaffoldAlert - Builds HTML to support a single alert

    ========================================================================= */
    function scaffoldAlert (alert_num, target){
        target = target || active_settings.targetElement;

        if (alert_num >= 0){
            if ( $( target ).length ){

                $(target).append(
                    $("<div/>").addClass("row a911-alert a911-alert-" + alert_num.toString()).html(`
<div class="al-title"></div>
<div class="al-loc"></div>
<div class="al-mist"><span class="al-time"></span><span class="al-box"></span><span class="all-cad"></span></div>`));

            }
        }
        return this;    // we support chaining
    }   // scaffoldWXDay()



    /* =========================================================================
    
    scaffoldActive911 - Builds out the HTML to support WX, in target

    ========================================================================= */
    function scaffoldActive911(target, count){
        count = count || 250;
        target = target || active_settings.targetElement;
        for (var ddx = 0; ddx < count ; ddx++) {
            scaffoldAlert(ddx, target);
        }

        return this;    // we support chaining
    }   // scaffoldActive911()



    /* =========================================================================
    
    go - Kicks off setInterval to update clock

    ========================================================================= */
    function go(){
        return false;
        setInterval(function(){
            fetchData();
        }, active_settings.updateResolution);
    }   // go()


    // Now we export
    $.active911 = active911;
    $.active911.updateCreds = updateCreds;

})(jQuery, moment);
