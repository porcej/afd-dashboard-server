
/***

jQuery NWS Weather API (nws.js)

An lite-weight National Weather Service Weather API
Copyright 2019 Joseph Porcelli
0.0.1

***/


(function ($) {
    'use strict';



    var wx_settings = {
        unit            : 'us',
        wxQueryInterval : 60*60*1000, // In milliseconds (60 min/hour * 60 sec/min * 1000 ms/sec)
        wxContainer     : '#cb-wx',
        highTemp        : 90,
        lowTemp         : 40,
        wxEndPoint      : 'https://api.weather.gov/gridpoints',
        forecastOffice  : 'LWX',
        grid            : '96,66',
        forecastLength  : 5,
        windThreshold   : 35,
        forecastUrl     : function(){
            var units;
            switch (this.unit.toLowerCase()) {
                case 'c':
                case 'si':
                    units = 'si';
                    break;
                case 'f':
                case 'us':
                default:
                    units = 'us';
                    break;
            }
            return [this.wxEndPoint, 
                    this.forecastOffice,
                    this.grid,
                    'forecast?units=' + units].join('/');
        }
    };

    var wx_target = {
        currently:  "wx-current", 
        forecast:   "wx-forecast",
        daily:      "wx-day" 
    };



    // Determines what shift is working on date
    var getShift = function( date ){

        date = date || moment();

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
                            return sdx;
                        }
                    }
                }
            }
        }

        return '';
        
    };  /* getShift() */
    var icons = {
        "skc": {
            "description": "Fair/clear",
            "day": "wi-day-sunny",
            "night": "wi-night-clear"
        },
        "few": {
            "description": "A few clouds",
            "day": "wi-day-sunny-overcast",
            "night": "wi-night-partly-cloudy"
        },
        "sct": {
            "description": "Partly cloudy",
            "day": "wi-day-cloudy",
            "night": "wi-night-partly-cloudy"
        },
        "bkn": {
            "description": "Mostly cloudy",
            "day": "wi-day-cloudy",
            "night": ""
        },
        "ovc": {
            "description": "Overcast",
            "day": "wi-day-sunny-overcast",
            "night": "wi-night-alt-cloudy"
        },
        "wind_skc": {
            "description": "Fair/clear and windy",
            "day": "wi-day-windy",
            "night": "wi-windy"
        },
        "wind_few": {
            "description": "A few clouds and windy",
            "day": "wi-day-cloudy-windy",
            "night": "wi-night-cloudy-windy"
        },
        "wind_sct": {
            "description": "Partly cloudy and windy",
            "day": "wi-day-cloudy-windy",
            "night": "wi-night-cloudy-windy"
        },
        "wind_bkn": {
            "description": "Mostly cloudy and windy",
            "day": "wi-cloudy-windy",
            "night": "wi-cloudy-windy"
        },
        "wind_ovc": {
            "description": "Overcast and windy",
            "day": "wi-cloudy-windy",
            "night": "wi-cloudy-windy"
        },
        "snow": {
            "description": "Snow",
            "day": "wi-day-snow",
            "night": "wi-night-snow"
        },
        "rain_snow": {
            "description": "Rain/snow",
            "day": "wi-day-rain-mix",
            "night": "wi-night-rain-mix"
        },
        "rain_sleet": {
            "description": "Rain/sleet",
            "day": "wi-day-rain-mix",
            "night": "wi-night-rain-mix"
        },
        "snow_sleet": {
            "description": "Rain/sleet",
            "day": "wi-day-rain-mix",
            "night": "wi-night-rain-mix"
        },
        "fzra": {
            "description": "Freezing rain",
            "day": "day-sleet",
            "night": "night-sleet"
        },
        "rain_fzra": {
            "description": "Rain/freezing rain",
            "day": "day-sleet",
            "night": "night-sleet"
        },
        "snow_fzra": {
            "description": "Freezing rain/snow",
            "day": "wi-day-snow",
            "night": "wi-night-snow"
        },
        "sleet": {
            "description": "Sleet",
            "day": "day-sleet",
            "night": "night-sleet"
        },
        "rain": {
            "description": "Rain",
            "day": "wi-day-rain",
            "night": "wi-night-alt-rain"
        },
        "rain_showers": {
            "description": "Rain showers (high cloud cover)",
            "day": "wi-day-showers",
            "night": "wi-night-alt-showers"
        },
        "rain_showers_hi": {
            "description": "Rain showers (low cloud cover)",
            "day": "wi-day-showers",
            "night": "wi-night-alt-showers"
        },
        "tsra": {
            "description": "Thunderstorm (high cloud cover)",
            "day": "wi-thunderstorm",
            "night": "wi-thunderstorm"
        },
        "tsra_sct": {
            "description": "Thunderstorm (medium cloud cover)",
            "day": "wi-day-thunderstorm",
            "night": "wi-night-thunderstorm"
        },
        "tsra_hi": {
            "description": "Thunderstorm (low cloud cover)",
            "day": "wi-day-thunderstorm",
            "night": "wi-night-thunderstorm"
        },
        "tornado": {
            "description": "Tornado",
            "day": "wi-tornado",
            "night": "wi-tornado"
        },
        "hurricane": {
            "description": "Hurricane conditions",
            "day": "wi-hurricane-warning",
            "night": "wi-hurricane-warning"
        },
        "tropical_storm": {
            "description": "Tropical storm conditions",
            "day": "wi-storm-warning",
            "night": "wi-storm-warning"
        },
        "dust": {
            "description": "Dust",
            "day": "wi-dust",
            "night": "wi-dust"
        },
        "smoke": {
            "description": "Smoke",
            "day": "wi-smoke",
            "night": "wi-smoke"
        },
        "haze": {
            "description": "Haze",
            "day": "wi-day-haze",
            "night": "wi-night-fog"
        },
        "hot": {
            "description": "Hot",
            "day": "wi-hot",
            "night": "wi-hot"
        },
        "cold": {
            "description": "Cold",
            "day": "wi-thermometer-exterior",
            "night": "wi-thermometer-exterior"
        },
        "blizzard": {
            "description": "Blizzard",
            "day": "wi-snow",
            "night": "wi-snow"
        },
        "fog": {
            "description": "Fog/mist",
            "day": "wi-day-fog",
            "night": "wi-night-fog"
        }
    };

    /* =========================================================================
    
    wx - Default constructor, creats a wx object with api_key 

    ========================================================================= */
    function wx( settings ){
        
        var wxKeys = getKeys(wx_settings);
        for (var kdx in wxKeys){
            var key = wxKeys[kdx];
            if (settings.hasOwnProperty(key)){
                wx_settings[key] = settings[key];
            }
        }

        scaffoldWX();

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
    
    nws - Fetch and render WX from NWS exactly once

    ========================================================================= */
    function nws( settings ){
        
        console.log("Updateing WX.");
        $.ajax({
            type: 'GET',
            url: wx_settings.forecastUrl(),
            dataType: 'json'
        }).done(function (result) {
            // Drill down into the returned data to find the relevant weather information
            // result = result.query.results.channel.item;
            result = result.properties.periods;

            var wxRoot = wx_settings.wxContainer;

            if ( $(wxRoot + " ." + wx_target.currently).length ){
                fillCurrently(result.shift());
            }

            if ( $(wxRoot + " ." + wx_target.forecast).length ){
                fillForecast(result);
            }
        });

        return this;    // we support chaining
    }   // NWS()

    /* =========================================================================
    
    run - Fetch and render WX from NWS every 
        wx_settings.wxQueryInterval milliseconds

    ========================================================================= */
    function run( settings ){
        setInterval(nws, wx_settings.wxQueryInterval);

        return this;    // we support chaining
    }   // run()


    /* =========================================================================
    
    scaffoldWX - Builds out the HTML to support WX, in target

    ========================================================================= */
    function scaffoldWX(){
        if ( $( wx_settings.wxContainer ).length ){

            var forecastClass = wx_target.forecast 
                                + " for" 
                                + wx_settings.forecastLength.toString()
                                + "day"; 
            
            // Buidl out the WX Root
            $( wx_settings.wxContainer )
                .append($('<div/>').addClass( wx_target.currently ))
                .append($('<div/>').addClass( forecastClass ));

            // Build Out Current Conditions
            scaffoldCurrent();

            // Build Out Forecast
            for (var ddx = 1; ddx <= wx_settings.forecastLength ; ddx++) {
                scaffoldWXDay(ddx);
            }

        }   // Else we don't have a wx container to scaffold off of
        
        return this;    // we support chaining
    }   // scaffoldWX()


    /* =========================================================================
    
    scaffoldCurrent - Builds out the HTML to support WX, in target

    ========================================================================= */
    function scaffoldCurrent(){
        
        // Create a var to hold current CSS selector
        var selector = wx_settings.wxContainer  + ' .' + wx_target.currently;

        // Make sure our div is there
        if ( $( selector ).length ){

            // Build out Current Child
            $(selector)
                .append($("<div/>").addClass("wx-day-name"))
                .append($("<div/>").addClass("wx-content"))


            selector += " .wx-content";
            $(selector)
                .append($("<div/>").addClass("wx-icon"))
                .append($("<div/>").addClass("wx-conditions"));

            // Build out the Current Conditions
            selector += " .wx-conditions";
            $(selector)
                .append($("<div/>").addClass("wx-temp"))
                .append($("<div/>").addClass("wx-desc"))
                .append($("<div/>").addClass("wx-wind"));
        }

        return this;    // we support chaining
    }   // scaffoldCurrent()



    /* =========================================================================
    
    scaffoldWXDay - Builds HTML to support a forecast for single day

    ========================================================================= */
    function scaffoldWXDay(day){

        // Create a var to hold current CSS selector
                // Create a var to hold current CSS selector
        var selector = wx_settings.wxContainer  + ' .' + wx_target.forecast;

        // Make sure our div is there
        if ( $( selector ).length ){

            // Add the day div
            $( selector )
                .append($("<div/>").addClass("wx-day day" + day.toString()));

            // Build out the day div
            selector += ' .day' + day.toString();
            $( selector )
                .append($("<div/>").addClass("wx-day-name"))
                .append($("<div/>").addClass("wx-icon"))
                .append($("<div/>").addClass("wx-temps"));

            // Build out high and low temps
            selector += " .wx-temps";
            $(selector)
                .append($("<div/>").addClass("wx-highTemp"))
                .append($("<div/>").addClass("wx-lowTemp"));
        }
        return this;    // we support chaining
    }   // scaffoldWXDay()


    /* =========================================================================
    
    setIcons - Sets the WX Icons

    ========================================================================= */
    function setIcons(icon_list, icon_src){
        icon_src = icon_src || '';
        $('head').append('<link rel="stylesheet" type="text/css" href="' + icon_src + '" />');
        if (icon_list.prop && icon_list.prop.constructor === Array){
            icons = icon_list;
        }
        return this;    // we support chaining
    }   // setIcons()


    /* =========================================================================
    
    displayTemp - Displays Temperature

    ========================================================================= */
    function displayTemp(element, temperature, unit) {
        $(element).html(temperature + " ")
                  .append($('<span>', {class: 'super-text'}).html('&deg;' + unit));
        var tempInt = parseInt(temperature)
        if (tempInt >= wx_settings.highTemp){
                $(element).addClass('wx-temp-hot');
            } else {
                $( element ).removeClass('wx-temp-hot');
                if (tempInt <= wx_settings.lowTemp){
                    $( element ).addClass('wx-temp-cold');
                } else {
                    $( element ).removeClass('wx-temp-cold');
                }
            }
    }   // displayTemp()


    /* =========================================================================
    
    fillCurrently - Fills the current conditions

    ========================================================================= */
    function fillCurrently(forecast) {
        // Root Selector for Current
        var wxRoot = wx_settings.wxContainer  + ' .' + wx_target.currently;
        var dayName = $( wxRoot + " .wx-day-name");
        var icon = $(wxRoot + ' .wx-icon');
        var desc = $(wxRoot + ' .wx-conditions .wx-desc');
        var temp = $(wxRoot + ' .wx-conditions .wx-temp');
        var wind = $(wxRoot + ' .wx-conditions .wx-wind');

        var fdate = moment(forecast.startTime, "YYYY-MM-DD");
        dayName .html(fdate.format('dddd, MMMM Do YYYY'))
                .attr('data-shift', getShift(fdate));

        // Insert the current details. 
        //  Icons may be changed by editing the icons array.
        if (icon.length) {
            icon.html(parseNWSIcon(forecast.icon));
        }
        if (desc.length) {
            desc.html(forecast.shortForecast);
        }
        if (temp.length) {
            displayTemp(temp, forecast.temperature, forecast.temperatureUnit)
        }
        if (wind.length){
            var windSpeed = parseInt(forecast.windSpeed.split(" ")[0]);
            if (windSpeed >= wx_settings.windThreshold) {
                wind.addClass('text-danger');
            } else {
                wind.removeClass('text-danger');
            }
            wind.html(forecast.windSpeed);
        }

    }   // fillCurrently()

    /* =========================================================================
    
    parseNWSIcon - Parses out the NWS Icon and Returns the corrisponding wi-icon

    @params
    icon - a URL for a NWS icon

    ========================================================================= */
    function parseNWSIcon(icon) {
        var icon_info = {
            "set": icon.split("/")[4],
            "timeOfDay": icon.split("/")[5],
            "icon": icon.split("/")[6].split("?")[0].split(",")[0]
        };
        return $('<i>', {class: 'wi'}).addClass(icons[icon_info.icon][icon_info.timeOfDay]);
    }   // parseNWSIcon()


    /* =========================================================================
    
    fillForecast - Fills the wx forecast
    
    @params
    forecasts - array of NWS forcast objects

    ========================================================================= */
    function fillForecast(forecasts) {
        var maxForecasts = Math.min((forecasts.length/2)-1, wx_settings.forecastLength);
        var wxRoot = wx_settings.wxContainer;
        var today = moment();
        var wdx = 1;

        while (wdx <= maxForecasts){
            var forecast = forecasts.shift()
            var fdate = moment(forecast.startTime, "YYYY-MM-DD");
            var wxEle = wxRoot + ' .' + wx_target.forecast
                    + ' .day' + wdx.toString();

            if ((today.isSame(fdate, 'day')) && (! forecast.isDaytime)){
                $( wxEle + " .wx-day-name")
                    .html("Tonight")
                    .attr('data-shift', getShift(fdate));

                $( wxEle + " .wx-icon")
                    .html(parseNWSIcon(forecast.icon));
                
                displayTemp(wxEle + ' .wx-lowTemp', forecast.temperature, forecast.temperatureUnit );
                $(wxEle + '.wx-highTemp').addClass('hidden-before');
                
            } else {
                if (forecast.isDaytime){
                    $( wxEle + " .wx-day-name")
                        .html(fdate.format('dddd'))
                        .attr('data-shift', getShift(fdate));

                    $( wxEle + " .wx-icon")
                        .html(parseNWSIcon(forecast.icon));
                                            
                    displayTemp(wxEle + ' .wx-highTemp', forecast.temperature, forecast.temperatureUnit );
                    $(wxEle + '.wx-highTemp').removeClass('hidden-before');
                    forecast = forecasts.shift();
                    displayTemp(wxEle + ' .wx-lowTemp', forecast.temperature, forecast.temperatureUnit );
                } // else { } we choose to ignore night time forecasts except for tonight (if its not night now)
            }

            wdx++;
        }
    }   // fillForecast()


    // Now we export
    $.wx = wx;
    $.wx.nws = nws;
    $.wx.run = run;


})(jQuery);
