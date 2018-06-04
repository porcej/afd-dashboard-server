
/***

jQuery Clock - A lightweight digital clock (clock.js)
Copyright 2017 Joseph Porcelli
0.0.1

***/


(function ($, moment) {
    'use strict';

    var clock_settings = {
            formatTime: 'HH:mm:ss',                 // Time format to display
            formatDate: 'dddd, MMMM Do YYYY',       // Date format to display
            targetClockElement: ".cb-clock",        // Target element for Clock
            targetTimeElement: ".cb-time",          // Target time element
            targetDateElement: ".cb-date",          // Target elment for Date
            updateResolution: 1000,                 // # of ms between time updates
            dateClassifier: function(date){         // Function to add class to date
                return ".cb-date";
            },
            updateDateClassifer: function(date){    // Function to update date class
                return true;
            }
    };


    /* =========================================================================
    
    Clock - lets do some majic

    ========================================================================= */
    function clock( settings ){
        
        var clockKeys = getKeys(clock_settings);
        for (var kdx in clockKeys){
            var key = clockKeys[kdx];
            if (settings.hasOwnProperty(key)){
                clock_settings[key] = settings[key];
            }
        }

        scaffoldClock();
        scaffoldDate();
        go();
        
        return this;    // we support chaining
    }   // wx()


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
    
    scaffoldClock - Builds HTML for clock

    ========================================================================= */
    function scaffoldClock(){
        $( clock_settings.targetClockElement ).each(function(idx){
            var timeStr = moment().format(clock_settings.formatTime);
            $( this ).append($( "<div/>" ).addClass("cb-time").html(timeStr));

            timeStr = timeStr.replace(/[a-z0-9]/gmi, '8');  // Build the background time string

            // Build the background div off screen
            $( this ).find(".cb-time").after($( "<div/>" ).addClass("cb-time-bkg").html(timeStr));

            // bring the background div onscreen and place under time
            $( this ).find(".cb-time-bkg").css({ 
                                                    top: $( this ).find(".cb-time").position().top, 
                                                    left:  $( this ).find(".cb-time").position().left,
                                                    height: $( this ).find(".cb-time").height(),
                                                    width: $( this ).find(".cb-time").width()
                                                });
        });
        return this;    // we support chaining
    }   // scaffoldClock()



    /* =========================================================================
    
    scaffoldDate - Builds out the HTML to support date display

    ========================================================================= */
    function scaffoldDate(){
        $( clock_settings.targetDateElement ).each(function( idx ) {
            var now = moment();
            $( this ).addClass(clock_settings.dateClassifier(now)); //_getShift() + "-shift-outline");
            $( this ).html(now.format(clock_settings.formatDate));
        });
        return this;    // we support chaining
    }   // scaffoldDate()


    /* =========================================================================
    
    go - Kicks off setInterval to update clock

    ========================================================================= */
    function go(){
        setInterval(function(){
            $( clock_settings.targetTimeElement ).each(function( idx ) {
                $( this ).html(moment().format(clock_settings.formatTime));
            });
            $( clock_settings.targetDateElement ).each(function( idx ) {
                var now = moment();
                $( this ).html(now.format(clock_settings.formatDate));
                clock_settings.updateDateClassifer(clock_settings.targetDateElement, now);
                // var allShiftClasses = "a-shift-outline b-shift-outline c-shift-outline";
                // var shiftClass = getShift() + "-shift-outline";
                // var tidyShiftClasses = allShiftClasses.replace(shiftClass);


                // $( this ).addClass(shiftClass);
                // $( this ).removeClass(tidyShiftClasses);
                // $( this ).attr('class', 'cleanstate');
            });
        }, clock_settings.updateResolution);
    }   // go()


    // Now we export
    $.clock = clock;

})(jQuery, moment);
