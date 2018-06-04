/***

jQuery webstaff

An lite-weight api wrapper for webstaff.xyz
Copyright 2017 Joseph Porcelli
0.0.2

***/


(function ($, moment) {
    'use strict';

    var ws_settings = {
            url                 : '/roster/',       // Where to get data '' is same domain
            targetElement       : ".cb-webstaff",   // Target HTML Element
            timer               : null,             // Var to hold timer to check for updates
            updateResolution    : 900000,           // # of ms between time updates
            // updateResolution: 500,
            // updateResolution: 60000,             // # of ms between time updates
                                                    //    900000 -> 15 min
            filters             : {
                                    '201': ['Station 201'],
                                    '202': ['Station 202'],
                                    '203': ['Station 203'],
                                    '204': ['Station 204'],
                                    '205': ['Station 205'],
                                    '206': ['Station 206'],
                                    '207': ['Station 207'],
                                    '208': ['Station 208'],
                                    '209': ['Station 209'],    
                                    '210': ['Station 210']},
            credFunc            : function(){return "";},   // function to get credentials
            filterFunc          : function(){return "";}  // function to get filters
    };


    /* =========================================================================
    
    webstaff - lets do some majic

    ========================================================================= */
    function webstaff( settings ){
        
        var sKeys = Object.keys(settings);
        for (var sdx in sKeys){
            var sKey = sKeys[sdx];
            if (ws_settings.hasOwnProperty(sKey)){
                if (sKey == 'credFunc'){
                    updateCreds( settings[sKey] );
                } else if (sKey == 'filterFunc'){
                    setFilter( settings[sKey] );
                } else {
                    ws_settings[sKey] = settings[sKey];
                }
            }
        }
        scaffoldRoster();
        go();
        
        return this;    // we support chaining
    }   // webstaff()


    /* =========================================================================
    
    getShift = given a date (moments) determines which shift is working

    ========================================================================= */
    function getShift( date ){

        date = moment(date) || moment();

        // First we clean up date by dropping hours, minutes and seconds
        // date = moment( date.getFullYear(), date.getMonth(), date.getDate() );

        var shiftMap = {
            // 2017/00/03 - 2017/00/05 - 2017/00/07
            a: {
                first: moment([2017,0,3]),
                second: moment([2017,0,5]),
                third: moment([2017,0,7])
            },
            // 2017/00/06 - 2017/00/08 - 2017/00/10
            b: {
                first: moment([2017,0,6]),
                second: moment([2017,0,8]),
                third: moment([2017,0,10])
            },
            // 2017/00/09 - 2017/00/11 - 2017/00/13
            c: {
                first: moment([2017,0,9]),
                second: moment([2017,0,11]),
                third: moment([2017,0,13])
            }

        };

        for ( var sdx in shiftMap ){
            if (shiftMap.hasOwnProperty( sdx )){
                for ( var ddx in shiftMap[sdx]){
                    if ( shiftMap[sdx].hasOwnProperty(ddx) ) {
                        var d = date.diff(shiftMap[sdx][ddx], 'days');
                        if (d % 9 === 0 ) {
                            return sdx.toString();
                        }
                    }
                }
            }
        }

        return '';
        
    }   // getShift()


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
            case 'm':
            case 'ems':
                return 'ems';
                break;

            // Command
            case 'bc':
            case 'ba':
            case 'so':
            case 'c':
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


    /* =========================================================================
    
    getCleanRank - Cleans the rank positions

    ========================================================================= */
    function getCleanRank( str ){
        str = str || '';


        // Prepare str by removing '.', '+', and leading + trailing white
        //      space, and making everything lower case
        str = str.replace(/[\.\+]/g, '').trim().toLowerCase();

        switch(str) {
            // Firefighters
            case 'firefighter':
            case 'firefighter basic':
                return 'firefighter';
                break;
            // Medics 
            case 'medic':
            case 'medic a':
                return 'medic';
                break;

            // Captains
            case 'captain':
            case 'captain he':
            case 'captain tr':
            case 'captain h':
            case 'captain a':
                return 'captain';
                break;

            // case Attendant
            case 'attendant':
            case 'attendant a':
            case 'attandant b':
                return 'attandant';
                break;

            // Generic officer
            case 'officer':
            case 'officer he':
            case 'officer tr':
            case 'officer h':
            case 'officer a':
            case 'officer b':
                return 'officer';
                break;

            // Lieutenant
            case 'lieutenant':
            case 'lieutenant a':
            case 'lieutenant b':
            case 'lieutenant h':
            case 'lieutenant tr':
            case 'lieutenant he':
                return 'lieutenant';
                break;

            // EMS Captain
            case 'ems captain':
            case 'ems captain a':
                return 'ems';
                break;

            // Battalion Chief
            case 'battalion chief':
                return 'bc';
                break;

            default:
                if ((str.includes('doe')) || (str.includes('dot'))) {
                    return 'driver';
                } else if ( str.includes('tt') ) {
                    return 'tt';
                } else {
                    return str;
                }
        }
        return '';

    }   // getCleanRank()


    /* =========================================================================
    
    getRankStyle - Returns the style and icon for rank specified in string

    ========================================================================= */
    function getRankStyle( str ) {
                str = str || '';
        str = getCleanRank( str );

        switch(str.toLowerCase()) {

            // EMS
            case 'ems':
            case 'medic':
            case 'attendant':
                return {
                        class: 'cb-ems',
                        icon: 'fa-user-md'
                    };
                break;

            // Drivers
            case 'driver':
                return {
                        class: 'cb-other',
                        icon: 'fa-car'
                    };
                break;

            // Officers
            case 'officer':
            case 'captain':
            case 'lieutenant':
            case 'bc':
                return {
                        class: 'cb-command',
                        icon: 'fa-star'
                    };
                break;

            // Firefihters (default)
            case 'firefighter':
            case 'tt':
            default:
                return {
                        class: 'cb-firefighter',
                        icon: 'fa-fire'
                    };
        }

       return {};
    }   // getRankStyle()


    /* =========================================================================
    
    parseNameCaps - Parses a Telestaff Roster Name to get the name
                     and the qualifications short codes

    ========================================================================= */
    function parseNameCaps( str ){
        return [str.replace(/\(.*$/g, '').trim(), str.replace(/^[^\(]*|\(|\)/g, '').trim()];
    }   // parseNamesCaps()


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
    
    parseShiftTimes - parses time out of Webstaff object

    ========================================================================= */
    function parseShiftTimes( str ){
        // 05/30/2017 07:00 AM
        str = str || '';

        str = str.slice(10);
        var parts = str.trim().split(' ');

        if (parts[1] == "PM"){
            var p = parts[0].split(":");

            if (p[0] != 12) {
                parts[0] = (parseInt(p[0]) + 12).toString() + ":" +p[1];
            }
        }
        
        return parts[0];
    }   // parseShiftTimes()


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
    
    setFilter - Sets the selected filter

    ===========================_============================================= */
    function setFilter( filter ){
        if (isFunction( filter )){
            ws_settings.filterFunc = filter;
        } else {
            filter = filter || '';
            ws_settings.filterFunc = function(){return filter;};
        }
    }   // setFilter()


    /* =========================================================================
    
    updateFilters - Sets the filters

    ===========================_============================================= */
    function updateFilters( filters ){
        if (isArray(filters)){
            ws_settings.filters = filters;
        }
    }   // updateFilters()


    /* =========================================================================
    
    updateCreds - Sets the creds

    ===========================_============================================= */
    function updateCreds( credFunction ){
        if (isFunction(credFunction)){
            ws_settings.credFunc = credFunction;
        } else {
            ws_settings.credFunc = function(){return credFunction; };
        }


    }   // updateCreds()



    /* =========================================================================
    
    fetchData - Gets roster data

    ========================================================================= */
    function fetchData(date){
        date = date || '';

        var now = moment().format('D MMM, YYYY - HH:mm:ss');
        console.log("Updating Telestaff data. Starting at " + now);

        $.ajax({
            type : 'GET',
            url  : ws_settings.url + date,
            dataType : 'json',
            success: function(json, textStatus, request){
                if (json.status_code.toString() == '200' ){
                    if (json.data.type == 'roster'){

                        var saveThis = function(title){
                            if (!title){
                                return false;
                            }

                            var filters = ws_settings.filters[afdDashboardConfig['station']].concat(afdDashboardConfig['home_units']);

                            if (filters.indexOf(title) >= 0){
                                return true;
                            }
                            return false;
                        };

                        var singleUnit = [];
                        var multipleUnits = [];

                        var rosterDate;


                        for (var ddx=0; ddx < json.data.Date.length; ddx++){
                                var tempDate = json.data.Date[ddx].title;
                                rosterDate = moment(tempDate.substr(tempDate.indexOf(',') + 1).trim(), "MMMM DD, YYYY");
                                rosterDate = "Ops " + getShift(rosterDate).toUpperCase() + " Shift";
                            if (saveThis(json.data.Date[ddx].title)){
                                if (json.data.Date[ddx].hasOwnProperty('Position')){
                                    singleUnit.push(json.data.Date[ddx]);
                                } else {
                                    multipleUnits.push(json.data.Date[ddx]);
                                }
                            } else {
                                var batallions = json.data.Date[ddx].Institution[0].Agency[0].Batallion;

                                for (var bdx=0; bdx < batallions.length; bdx++){
                                    if (saveThis(batallions[bdx].title)){
                                       if (batallions[bdx].hasOwnProperty('Position')){
                                            singleUnit.push(batallions[bdx]);
                                        } else {
                                            multipleUnits.push(batallions[bdx]);
                                        }
                                    } else {
                                        var shifts = batallions[bdx].Shift;
                                        for (var shiftDx = 0; shiftDx < shifts.length; shiftDx++){
                                            if (shifts[shiftDx].title !== rosterDate){
                                                continue;
                                            }

                                            if ( saveThis( shifts[shiftDx].title )){

                                               if (shifts[shiftDx].hasOwnProperty('Position')){
                                                    singleUnit.push(shifts[shiftDx]);
                                                } else {
                                                    multipleUnits.push(shifts[shiftDx]);
                                                }
                                            } else {
                                                var stations = shifts[shiftDx].Station;
                                                for (var sdx=0; sdx < stations.length; sdx++){
                                                    if ( saveThis( stations[sdx].title )){
                                                       if (stations[sdx].hasOwnProperty('Position')){
                                                            singleUnit.push(stations[sdx]);
                                                        } else {
                                                            multipleUnits.push(stations[sdx]);
                                                        }
                                                    } else {
                                                        var units = stations[sdx].Unit;
                                                        for (var udx=0; udx < units.length;udx++){
                                                            if( saveThis( units[udx].title ) ){
                                                               if (units[udx].hasOwnProperty('Position')){
                                                                    singleUnit.push(units[udx]);
                                                                } else {
                                                                    multipleUnits.push(units[udx]);
                                                                }
                                                            }
                                                        }

                                                    }
                                                }
                                            }
                                        }
                                    }
                                }


                            }

                        }   // End Unit Filtering

                        json = '';  // Clear the json object to save memory

                        var notes = [];

                        // Clear out old units html
                        $('.ts-positions').html('');

                        // Prepare single units
                        for (var udx = 0; udx < singleUnit.length; udx++){
                            if (! singleUnit[udx].dot){
                                var unit = singleUnit[udx];

                                // Get notes if there are there
                                if (unit.notes !== ''){
                                    notes.push({
                                                owner: unit.title,
                                                type: 'unit',
                                                note: unit.notes
                                            });
                                }
                                var unitDiv = $('<div/>').addClass("input-group cb-" + getUnitType(unit.title))
                                                         .append('<span class="input-group-btn">'
                                                                  + '<button class="btn" type="button"> '
                                                                    + unit.title +' </button></span>');

                                var positions = unit.Position;

                                for (var pdx = 0; pdx < positions.length; pdx++){
                                    if ((!positions[pdx].dot) && (positions[pdx].name !== '')){


                                        // Filter out exception codes except for white and green
                                            // backgrounds with black text
                                        if (positions[pdx].exceptioncode !== ''){
                                          var workcode = positions[pdx].workcode.toUpperCase();
                                          if ((workcode.indexOf("ANL") !== -1)||(workcode.indexOf("TTN") !== -1)||(workcode.indexOf("KELLY") !== -1)||(workcode.indexOf("CTU") !== -1)||(workcode.indexOf("SICK") !== -1)||(workcode.indexOf("FSL") !== -1)){
                                            continue;
                                          }
                                        }

                                        var name = parseNameCaps(positions[pdx].name)[0];
                                        

                                        var timeText = parseShiftTimes(positions[pdx].startTime) 
                                                        + " - " 
                                                        + parseShiftTimes(positions[pdx].endTime);

                                        if ( timeText == "07:00 - 07:00" ){
                                            timeText = "";
                                        }

                                        unitDiv.append('<div class="form-control">'
                                                         + '<span class="name">' + name 
                                                         + '</span><span class="ts-times">' 
                                                         + timeText + '</span></div>');
                                    }
                                }
                                unitDiv.appendTo('.ts-positions');
                            }
                        }   // END SINGLE UNIT PROCESSING


                        // Clear out old unites data
                        $(".ts-units").html('');

                        // Prepare multiple units
                        for (var sdx=0; sdx < multipleUnits.length; sdx++ ){
                            if (! multipleUnits[sdx].dot){
                                if (multipleUnits[sdx].notes !== ''){
                                    notes.push({
                                                owner: multipleUnits[sdx].title,
                                                type: 'station',
                                                note: multipleUnits[sdx].notes
                                            });
                                }
                                var units = multipleUnits[sdx].Unit;
                                for (var udx=0; udx < units.length; udx++ ){
                                    if (!units[udx].dot){
                                        if (units[udx].notes !== ''){
                                            notes.push({
                                                        owner: units[udx].title,
                                                        type: 'unit',
                                                        note: units[udx].notes
                                                    });
                                        }
                                        var unitDiv = $('<div/>').addClass("card cb-unit-roster cb-" + getUnitType(units[udx].title));
                                        unitDiv.append('<div class="card-header clearfix"><h4 class="card-title">' + units[udx].title + '</h4></div>');

                                        var positions = units[udx].Position;
                                        var positionsDiv = $('<div/>').addClass('card-block');

                                        var pstyle = getRankStyle('');


                                        for (var pdx = 0; pdx < positions.length; pdx++){
                                            if ((!positions[pdx].dot) && (positions[pdx].name !== '')){
                                              
                                                // We want to get style information first
                                                //      for the case were a position is off is listed first
                                                if (positions[pdx].title !== ''){
                                                    pstyle = getRankStyle(positions[pdx].title);
                                                }
                                            
                                                if (positions[pdx].exceptioncode !== ''){
                                                  var workcode = positions[pdx].workcode.toUpperCase();
                                                  if ((workcode.indexOf("ANL") !== -1)||(workcode.indexOf("TTN") !== -1)||(workcode.indexOf("KELLY") !== -1)||(workcode.indexOf("CTU") !== -1)||(workcode.indexOf("SICK") !== -1)||(workcode.indexOf("FSL") !== -1)){
                                                    continue;
                                                  }
                                                }

                                          
                                                var name = parseNameCaps(positions[pdx].name)[0];
                                                
                                                var timeText = parseShiftTimes(positions[pdx].startTime) +
                                                                " - " + 
                                                                parseShiftTimes(positions[pdx].endTime);

                                                if ( timeText == "07:00 - 07:00" ){
                                                    timeText = "";
                                                }

                                                $('<div/>').addClass("input-group " + pstyle.class)
                                                           .append('<span class="input-group-btn">'
                                                                    + '<button class="btn" type="button">'
                                                                    + '<i class="fa fa-fw ' + pstyle.icon
                                                                    +  '" aria-hidden="true"></i> </button>'
                                                                    + '</span>')
                                                           .append('<div class="form-control"><span class="name">' 
                                                                    + name + '</span><span class="ts-times">' 
                                                                    + timeText + '</span></div>')
                                                           .appendTo(positionsDiv);
                                            }

                                        }
                                        unitDiv.append(positionsDiv);
                                        unitDiv.appendTo(".ts-units");
                                    }
                                }
                            }
                        }   // END MULTIPLE UNIT PROCESSING


                        // Clear out old agenda
                        

                        // Process notes
                        if ( notes.length ){
                            var notesDiv = $('<div/>').addClass('card-block');


                            // Loop over notes displaying all station notes
                            for (var ndx = 0; ndx < notes.length; ndx++){
                                if (notes[ndx].type == 'station'){
                                    $('<p/>').addClass('card-text')
                                             .append(notes[ndx].note)
                                             .appendTo(notesDiv);
                                }
                            }

                            // Loop over notes displaying all unit notes
                            for (var ndx = 0; ndx < notes.length; ndx++){
                                if (notes[ndx].type == 'unit'){

                                    $('<div/>').addClass("input-group cb-" + getUnitType(notes[ndx].owner))
                                               .append('<span class="input-group-btn">'
                                                        + '<button class="btn" type="button">'
                                                        + notes[ndx].owner + '</button>'
                                                        + '</span>')
                                               .append('<div class="form-control">'
                                                        + notes[ndx].note 
                                                        + '</div>')
                                               .appendTo(notesDiv);
                                }
                            }
                            $('.ts-agenda').html($('<div/>').addClass('card cb-agenda')
                                                            .append('<h3 class="card-header">Agenda</h3>')
                                                            .append(notesDiv));
                        } else {
                            $('.ts-agenda').html('');
                        }   // END PROCESSING NOTES


                        // filter = 
                    }
                } else {
                  $(".cb-webstaff").html('<div class="ts-agenda"><div class="card cb-agenda">' +
                          '<h3 class="card-header">Error Accessing Telestaff</h3>' +
                           '<div class="card-block"><p class="card-text">' +
                          json.data +
                           '</p></div></div>');
                }

                // After successfully loading telestaff... let use schedule the next run
                // Then we set this to call itself every updateResolutions milliseconds
                ws_settings.timer = setTimeout(function(){
                    fetchData();
                }, ws_settings.updateResolution);

            },
            error: function(xhr, ajaxOpts, thrownError){
                console.log("Response Error: ", xhr.status)
                if (xhr.status === 0 ){ // if no response try again
                  console.log("Assume no response from the server.");
                  fetchData();  
                } else {
                   $(".cb-webstaff").html('<div class="ts-agenda"><div class="card cb-agenda">' +
                          '<h3 class="card-header">Error Accessing Telestaff</h3>' +
                           '<div class="card-block"><p class="card-text">' +
                          xhr.status +
                           '</p></div></div>');
                // After unsuccessfully loading telestaff... let use schedule the next run
                // Then we set this to call itself every updateResolutions milliseconds
               
                ws_settings.timer = setTimeout(function(){
                    fetchData();
                }, ws_settings.updateResolution / 15);
                  
                }
               
            }
        });
    }   // fetchData()


    /* =========================================================================
    
    scaffoldRoster - Builds HTML for clock

    ========================================================================= */
    function scaffoldRoster(){
        $(ws_settings.targetElement).append('<div class="ts-agenda"></div>');
        $(ws_settings.targetElement).append('<div class="card-group ts-units"></div>');
        $(ws_settings.targetElement).append('<div class="ts-positions"></div>');

        return this;    // we support chaining
    }   // scaffoldRoster()



    /* =========================================================================
    
    go - Kicks off setInterval to update clock

    ========================================================================= */
    function go(){
        return fetchData();
    }   // go()


    /* =========================================================================
    
    reset - cleans everything up and reloads

    ========================================================================= */
    function reset(){
        shutdown();
        scaffoldRoster();
        return fetchData();
    }   // reset()


    /* =========================================================================
    
    shutdown - Ends updates and removes all contents
    takes an optional message parameter to display in target element

    ========================================================================= */
    function shutdown(msg){
        msg = msg || '';
        // First we prevent any further updates
        clearTimeout(ws_settings.timer);

        // Now we remove content
        $(ws_settings.targetElement).html(msg);

        return this;    // We support chaining... even in death
    }   // shutdown()    


    // Now we export
    $.webstaff                  = webstaff;
    $.webstaff.setFilter        = setFilter;
    $.webstaff.updateFilters    = updateFilters;
    $.webstaff.updateCreds      = updateCreds;
    $.webstaff.shutdown         = shutdown;
    $.webstaff.reset            = reset;
    $.webstaff.go               = go;

})(jQuery, moment);
