/***

jQuery webstaff

An lite-weight api wrapper for webstaff.xyz
Copyright 2017 Joseph Porcelli
0.0.2

***/


(function ($, moment) {
    'use strict';

    var ws_settings = {
            url                 : '/roster/',           // Where to get data '' is same domain
            targetElement       : ".cb-webstaff",       // Target HTML Element
            alertElement        : ".cb-webstaff-alert", // Target Element for HTML Alerts
            rosterElement       : ".cb-webstaff-roster",// Target element Roster
            timer               : null,                 // Var to hold timer to check for updates
            // updateResolution    : 30000,
            updateResolution    : 900000,               // # of ms between time updates
            // updateResolution: 500,
            // updateResolution: 60000,                 // # of ms between time updates
                                                        //    900000 -> 15 min
            rollOverTime        : "2400",               // Time of day to show
                                                        // next day's roster HHmm
                                                        // Note that setting this to 0000
                                                        // will always show tomorrow's roster
                                                        // while setting this to 2400
                                                        // will always show the current day's roster        
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
    
    formateTimeText- Formats a TS time range for roster display

    ========================================================================= */
    function formateTimeText( startTime, endTime ){
        var timeText = parseShiftTimes(startTime) 
                        + " - " 
                        + parseShiftTimes(endTime);
        
        if ( timeText == "07:00 - 07:00" ){
            timeText = "";
        } else if (timeText == "07:00 - 19:00") {
            timeText = '<i class="wi wi-day-sunny"></i>';
        } else if (timeText == "19:00 - 07:00") {
            timeText = '<i class="wi wi-night-clear"></i>';
        }

        return timeText;
    }   // formateTimeText()


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
            case 'attendant b':
                return 'attendant';
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

            // Battalion Aide
            case 'battalion aide':
                return 'ba';
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
            case 'ems supervisor':
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
            case 'ba':
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
     *
     * determineRoster - Chooses which roster date roster to obtain based
     *                      on ws_settings.rollOverTime.
     *
     * @return  {boolean}   - True if a roster is returned, false otherwise.
     *
     *
     * ====================================================================== */    
    function determineRoster(){
        var rollOverDate = moment(moment().format("YYYYMMDD") 
                            + "T" 
                            + ws_settings.rollOverTime);
        var date = moment();
        if (date.isAfter(rollOverDate)){
            date = date.add(1, "day");
        }
        return fetchData(date);
    }   // determineRoster()


    /* =========================================================================
     *
     * fetchData - Gets roster dat from telestaff API.
     *
     * @param   {str|momentjs|date}     [date=''] - Date representing the date to
     *                                          fetch roster date for
     *                                          empty string returns current
     *                                          date.
     * @return  {boolean}   - True if a roster is returned, false otherwise.
     *
     *
     * ====================================================================== */
    function fetchData(date){
        date = moment(date);    // Pass off handling of date types to Moment.js
        

        var now = moment().format('D MMM, YYYY - HH:mm:ss');
        console.log("Updating Telestaff data. Starting at " + now);

        $.ajax({
            type : 'GET',
            url  : ws_settings.url + date.format('YYYYMMDD'),
            dataType : 'json',
            success: function(json, textStatus, request){
                $(ws_settings.alertElement).remove();
                console.log("Telestaff data received at " + moment().format('D MMM, YYYY - HH:mm:ss') + ".");
                if (json.status_code.toString() == '200' ){
                    if (json.data.type == 'roster'){

                        var saveThis = function(title){
                            if (!title){
                                return false;
                            }

                            var filters = ws_settings
                                            .filters[afdDashboardConfig['station']]
                                            .concat(afdDashboardConfig['home_units']);

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
                        $(ws_settings.rosterElement).html('');

                         // Prepare multiple units
                        for (var sdx=0; sdx < multipleUnits.length; sdx++ ){
                            if (! multipleUnits[sdx].dot){
                                
                                var units = multipleUnits[sdx].Unit;
                                for (var udx=0; udx < units.length; udx++ ){
                                    if (!units[udx].dot){
                                        var unitHeader = '<div class="card-header clearfix">' + units[udx].title;
                                 
                                        if (units[udx].notes !== ''){
                                            unitHeader += '<hr><p class="ts-notes">' + units[udx].notes + '</p>';
                                        }
                                        unitHeader += '</div>';
                                        var unitDiv = $('<div/>').addClass("card mb-4 cb-unit-roster cb-" + getUnitType(units[udx].title));
                                        unitDiv.append(unitHeader);

                                        var positions = units[udx].Position;
                                        // var positionsDiv = $('<div/>').addClass('card-block');
                                        var positionsDiv = $('<table/>').addClass('unit-positions');

                                        var pstyle = getRankStyle('');


                                        for (var pdx = 0; pdx < positions.length; pdx++){
                                            // We only care about working positions with member's name
                                            if ((positions[pdx].isWorking) && (positions[pdx].name !== '')){
                                              
                                                // We want to get style information first
                                                //      for the case were a position is off is listed first
                                                if (positions[pdx].title !== ''){
                                                    pstyle = getRankStyle(positions[pdx].title);
                                                }
                                                                                      
                                                var name = parseNameCaps(positions[pdx].name)[0];
                                                
                                                var timeText = formateTimeText(
                                                                    positions[pdx].startTime, 
                                                                    positions[pdx].endTime);

                                                $('<tr/>').addClass(pstyle.class)
                                                           .append('<td class="btn cb-pos-icon"><i class="fa fa-fw ' + pstyle.icon +  '" aria-hidden="true"></i></td>')
                                                           .append('<td class="name">' + name + '</td>')
                                                           .append('<td class="ts-times">' + timeText + '</td>')
                                                           .appendTo(positionsDiv);
                                            }

                                        }
                                        unitDiv.append(positionsDiv);
                                        unitDiv.appendTo(ws_settings.rosterElement);
                                    }
                                }
                            }
                        }   // END MULTIPLE UNIT PROCESSING

                        // Prepare single units
                        for (var udx = 0; udx < singleUnit.length; udx++){
                            if (! singleUnit[udx].dot){
                                var unit = singleUnit[udx];

                                var unitHeader = '<div class="card-header clearfix">' + unit.title;


                                // Get notes if there are there
                                if (unit.notes !== ''){
                                    unitHeader += '<hr><p class="ts-notes">' + unit.notes + '</p>';
                                }
                                unitHeader += '</div>';
                                var unitDiv = $('<div/>').addClass("card mb-4 cb-unit-roster cb-" + getUnitType(unit.title));
                                    unitDiv.append(unitHeader);

                                var positions = unit.Position;

                                var positionsDiv = $('<table/>').addClass('unit-positions');

                                var pstyle = getRankStyle('');

                                for (var pdx = 0; pdx < positions.length; pdx++){
                                    
                                    // We only care about working positions with member's name
                                    if ((positions[pdx].isWorking) && (positions[pdx].name !== '')){

                                        // We want to get style information first
                                        //      for the case were a position is off is listed first
                                        if (positions[pdx].title !== ''){
                                            pstyle = getRankStyle(positions[pdx].title);
                                        }

                                        var name = parseNameCaps(positions[pdx].name)[0];

                                        var timeText = formateTimeText(
                                                            positions[pdx].startTime, 
                                                            positions[pdx].endTime);

                                        $('<tr/>').addClass(pstyle.class)
                                                           .append('<td class="btn cb-pos-icon"><i class="fa fa-fw ' + pstyle.icon +  '" aria-hidden="true"></i></td>')
                                                           .append('<td class="name">' + name + '</td>')
                                                           .append('<td class="ts-times">' + timeText + '</td>')
                                                           .appendTo(positionsDiv);
                                    }
                                }
                                unitDiv.append(positionsDiv);
                                unitDiv.appendTo(ws_settings.rosterElement);
                            }
                        }   // END SINGLE UNIT PROCESSING

                        // Process notes
                        if ( notes.length ){
                            var notesDiv = $('<table/>').addClass('unit-positions');


                            // Loop over notes displaying all station notes
                            for (var ndx = 0; ndx < notes.length; ndx++){
                                $('<tr/>').append('<td>&nbsp;</td>')
                                           .append('<td class="name">' + notes[ndx].note + '</td>')
                                           .appendTo(notesDiv);
                            }

                            $(ws_settings.rosterElement).append($('<div/>')
                                                            .addClass('card mb-4 cb-unit-roster cb-other')
                                                            .append('<div class="card-header clearfix">Station Events</div>')
                                                            .append(notesDiv));
                        } else {
                            $('.ts-agenda').html('');
                        }   // END PROCESSING NOTES

                    }
                } else {
                    showAlert("Error Accessing Telestaff.", '<strong>Oh Snap</strong> something has gone terribly wrong.'
                                              + ' Telestaff says ' + json.status_code.toString() + '!');
                }

                // After successfully loading telestaff... let use schedule the next run
                // Then we set this to call itself every updateResolutions milliseconds
                ws_settings.timer = setTimeout(function(){
                    determineRoster();  // fetchData();
                }, ws_settings.updateResolution);

            },
            error: function(xhr, ajaxOpts, thrownError){
                console.log("Response Error: ", xhr.status)
                if (xhr.status === 0 ){ // if no response try again
                    showAlert("Error Accessing Telestaff.", '<strong>Oh Snap</strong> Telestaff is not responding.!');
                    console.log("No response from the Telestaff Server.");
                    fetchData();  
                } else {
                    showAlert("Error Accessing Telestaff.", '<strong>Oh Snap</strong> something has gone terribly wrong.'
                                                      + ' Telestaff says ' + xhr.status + '!');

                // After unsuccessfully loading telestaff... let use schedule the next run
                // Then we set this to call itself every updateResolutions milliseconds
               
                ws_settings.timer = setTimeout(function(){
                    determineRoster();  // fetchData();
                }, ws_settings.updateResolution / 15);
                  
                }
               
            }
        });
    }   // fetchData()

    /* =========================================================================
    
    showAlert - displays an alert

    ========================================================================= */
    function showAlert(title="", body=""){
        if (! $(ws_settings.alertElement).length){
            $(ws_settings.targetElement).prepend('<div class="alert alert-danger ' 
                                                + ws_settings.alertElement.substr(1)
                                                + '" role="alert">');
        }
        $(ws_settings.alertElement).html('<h4 class="alert-heading">' + title + '</h4>' 
                                            + '<p>' + body + '</p>');
    }   // showAlert()



    /* =========================================================================
    
    scaffoldRoster - Builds HTML for clock

    ========================================================================= */
    function scaffoldRoster(){
        // $(ws_settings.targetElement).append('<div class="ts-agenda mb-4"></div>');
        
        $(ws_settings.targetElement).append('<div class="card-deck mb-4 '
                                                + ws_settings.rosterElement.substr(1)
                                                + '"></div>');
         return this;    // we support chaining
    }   // scaffoldRoster()

 
    /* =========================================================================
    
    go - Kicks off setInterval to update clock

    ========================================================================= */
    function go(){
        return determineRoster();  // fetchData();
    }   // go()


    /* =========================================================================
    
    reset - cleans everything up and reloads

    ========================================================================= */
    function reset(){
        shutdown();
        scaffoldRoster();
        return determineRoster();  // fetchData();
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
