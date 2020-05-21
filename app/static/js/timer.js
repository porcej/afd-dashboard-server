
/***

jQuery Timer - A lightweight digital timer (timer.js)
Copyright 2017 Joseph Porcelli
0.0.1

***/


(function ($, moment) {
    'use strict';

    var timer_settings = {
            formatTime: 'mm:ss',                 // Time format to display
            targetElement: "cb-time",           // Target time element
            updateResolution: 1000,             // # of ms between time updates
    };

    var intervalId = '';

    // function targetEl()


    /* =========================================================================
    
    Timer - lets do some majic

    ========================================================================= */
    function timer( settings ){
        settings = settings || {};
        
        // Update settings with those provided
        var timerKeys = getKeys(timer_settings);
        for (var kdx in timerKeys){
            var key = timerKeys[kdx];
            if (settings.hasOwnProperty(key)){
                timer_settings[key] = settings[key];
            }
        }

        // Scaffold timer for each applied div
        this.each(function(){
            // $( this ).html("hello");      // Clear out contents of container
            scaffoldTimer($( this ));
        });

        // Kill timer if it is running
        if (intervalId != ''){ 
            kill();
        }

        // startTimer
        // if 
        startTimer(this);
        
        return this;    // we support chaining
    }   // timer()


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
    
    scaffoldTimer - Builds HTML for timer

    ========================================================================= */
    function scaffoldTimer(el){
        el.html("");        // Clear out the element's html contents
        var timeStr = moment().startOf("day")
                              .format(timer_settings.formatTime); 

        el.append($( "<div/>" ).addClass(timer_settings.targetElement)
                               .html(timeStr));

        // Build the background time string
        timeStr = timeStr.replace(/[a-z0-9]/gmi, '8');

        // Build the background div off screen
        el.append($( "<div/>" ).addClass("cb-time-bkg")
                               .html(timeStr));

        // To make things easy we will hold the target Element here
        var elTarget = el.find("." + timer_settings.targetElement);

        // bring the background div onscreen and place under time
        el.find(".cb-time-bkg")
          .css({ 
                top: elTarget.position().top, 
                left:  elTarget.position().left,
                height: elTarget.height(),
                width: elTarget.width()
          });
    }   // scaffoldTimer()


    /* =========================================================================
    
    startTimer - Kicks off setInterval to update timer

    ========================================================================= */
    function startTimer(el){
        var timeCounter = moment().startOf("day");
        intervalId = setInterval(function(){
            timeCounter.add(timer_settings.updateResolution, 'ms');
            el.each(function(){
                $( this ).find("." + timer_settings.targetElement)
                         .html(timeCounter.format(timer_settings.formatTime));
            });
        }, timer_settings.updateResolution);
    }   // startTimer()


    /* =========================================================================
    
    kill - kills updates

    ========================================================================= */
    function kill(){
        clearInterval(intervalId);
    }   // kill


    // Now we export
    $.fn.timer = timer;
    $.fn.timer.kill = kill;

})(jQuery, moment);
