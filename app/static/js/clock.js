
/***

jQuery Clock - A lightweight digital clock (clock.js)
Copyright 2017 Joseph Porcelli
0.0.1

***/


(function ($, moment) {
    'use strict';

    var clock_settings = {
            formatTime: 'HH:mm:ss',             // Time format to display
            targetElement: "cb-time",           // Target time element
            updateResolution: 1000,             // # of ms between time updates
    };

    var intervalId = '';

    // function targetEl()


    /* =========================================================================
    
    Clock - lets do some majic

    ========================================================================= */
    function clock( settings ){
        settings = settings || {};
        
        // Update settings with those provided
        var clockKeys = getKeys(clock_settings);
        for (var kdx in clockKeys){
            var key = clockKeys[kdx];
            if (settings.hasOwnProperty(key)){
                clock_settings[key] = settings[key];
            }
        }

        // Scaffold clock for each applied div
        this.each(function(){
            // $( this ).html("hello");      // Clear out contents of container
            scaffoldClock($( this ));
        });

        // Kill clock if it is running
        if (intervalId != ''){ 
            kill();
        }

        // startClock
        // if 
        startClock(this);
        
        return this;    // we support chaining
    }   // clock()


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
    function scaffoldClock(el){
        el.html("");        // Clear out the element's html contents
        var timeStr = moment().format(clock_settings.formatTime); 

        el.append($( "<div/>" ).addClass(clock_settings.targetElement)
                               .html(timeStr));

        // Build the background time string
        timeStr = timeStr.replace(/[a-z0-9]/gmi, '8');

        // Build the background div off screen
        el.append($( "<div/>" ).addClass("cb-time-bkg")
                               .html(timeStr));

        // To make things easy we will hold the target Element here
        var elTarget = el.find("." + clock_settings.targetElement);

        // bring the background div onscreen and place under time
        el.find(".cb-time-bkg")
          .css({ 
                top: elTarget.position().top, 
                left:  elTarget.position().left,
                height: elTarget.height(),
                width: elTarget.width()
          });
    }   // scaffoldClock()


    /* =========================================================================
    
    startClock - Kicks off setInterval to update clock

    ========================================================================= */
    function startClock(el){
        intervalId = setInterval(function(){
            el.each(function(){
                $( this ).find("." + clock_settings.targetElement)
                         .html(moment().format(clock_settings.formatTime));
            });
        }, clock_settings.updateResolution);
    }   // startClock()


    /* =========================================================================
    
    kill - kills updates

    ========================================================================= */
    function kill(){
        clearInterval(intervalId);
    }   // kill


    // Now we export
    $.fn.clock = clock;
    $.fn.clock.kill = kill;

})(jQuery, moment);
