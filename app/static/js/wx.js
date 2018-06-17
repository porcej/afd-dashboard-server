
/***

jQuery Yahoo Weather API (wx.js)

An lite-weight Yahoo Weather API
Copyright 2017 Joseph Porcelli
0.0.2

***/


(function ($) {
    'use strict';

    var wx_settings = {
        api_key         : '',
        woeid           : 0,
        unit            : 'F',
        wxQueryInterval : 60*60*1000, // In milliseconds (60 min/hour * 60 sec/min * 1000 ms/sec)
        wxContainer     : '#cb-wx',
        highTemp        : 90,
        lowTemp         : 40,
        dataUrl         : 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%3D'
    };

    var wx_target = {
        currently:  "wx-current", 
        forecast:   "wx-forecast",
        daily:      "wx-day" 
    };

    var forecastLength = 5;

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

    var icons = [
        '<i class="wi wi-tornado"></i>',            //tornado
        '<i class="wi wi-rain-wind"></i>',          //tropical storm
        '<i class="wi wi-tornado"></i>',            //hurricane
        '<i class="wi wi-thunderstorm"></i>',       //severe thunderstorms
        '<i class="wi wi-thunderstorm"></i>',       //thunderstorms
        '<i class="wi wi-rain-mix"></i>',           //mixed rain and snow
        '<i class="wi wi-rain-mix"></i>',           //mixed rain and sleet
        '<i class="wi wi-rain-mix"></i>',           //mixed snow and sleet
        '<i class="wi wi-rain-mix"></i>',           //freezing drizzle
        '<i class="wi wi-cloudy"></i>',             //drizzle
        '<i class="wi wi-rain"></i>',               //freezing rain
        '<i class="wi wi-rain"></i>',               //showers
        '<i class="wi wi-rain"></i>',               //showers
        '<i class="wi wi-snow"></i>',               //snow flurries
        '<i class="wi wi-snow"></i>',               //light snow showers
        '<i class="wi wi-showers"></i>',            //blowing snow
        '<i class="wi wi-snow"></i>',               //snow
        '<i class="wi wi-hail"></i>',               //hail
        '<i class="wi wi-rain-mix"></i>',           //sleet
        '<i class="wi wi-dust"></i>',               //dust
        '<i class="wi wi-fog"></i>',                //foggy
        '<i class="wi wi-day-haze"></i>',           //haze
        '<i class="wi wi-smoke"></i>',              //smoky
        '<i class="wi wi-strong-wind"></i>',        //blustery
        '<i class="wi wi-strong-wind"></i>',        //windy
        '<i class="wi wi-snowflake-cold"></i>',     //cold
        '<i class="wi wi-cloudy"></i>',             //cloudy
        '<i class="wi wi-night-cloudy"></i>',       //mostly cloudy (night)
        '<i class="wi wi-day-cloudy"></i>',         //mostly cloudy (day)
        '<i class="wi wi-night-cloudy"></i>',       //partly cloudy (night)
        '<i class="wi wi-day-cloudy"></i>',         //partly cloudy (day)
        '<i class="wi wi-night-clear"></i>',        //clear (night)
        '<i class="wi wi-day-sunny"></i>',          //sunny
        '<i class="wi wi-night-clear"></i>',        //fair (night)
        '<i class="wi wi-day-sunny"></i>',          //fair (day)
        '<i class="wi wi-hail"></i>',               //mixed rain and hail
        '<i class="wi wi-hot"></i>',                //hot
        '<i class="wi wi-storm-showers"></i>',      //isolated thunderstorms
        '<i class="wi wi-storm-showers"></i>',      //scattered thunderstorms
        '<i class="wi wi-storm-showers"></i>',      //scattered thunderstorms
        '<i class="wi wi-showers"></i>',            //scattered showers
        '<i class="wi wi-sleet"></i>',              //heavy snow
        '<i class="wi wi-snow"></i>',               //scattered snow showers
        '<i class="wi wi-sleet"></i>',              //heavy snow
        '<i class="wi wi-cloudy"></i>',             //partly cloudy
        '<i class="wi wi-storm-showers"></i>',      //thundershowers
        '<i class="wi wi-snow"></i>',               //snow showers
        '<i class="wi wi-storm-showers"></i>'       //isolated thundershowers
    ];

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
    
    scaffoldWX - Builds out the HTML to support WX, in target

    ========================================================================= */
    function scaffoldWX(){
        if ( $( wx_settings.wxContainer ).length ){

            var forecastClass = wx_target.forecast 
                                + " for" 
                                + forecastLength.toString()
                                + "day"; 
            
            // Buidl out the WX Root
            $( wx_settings.wxContainer )
                .append($('<div/>').addClass( wx_target.currently ))
                .append($('<div/>').addClass( forecastClass ));

            // Build Out Current Conditions
            scaffoldCurrent();

            // Build Out Forecast
            for (var ddx = 1; ddx <= forecastLength ; ddx++) {
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
                .append($("<div/>").addClass("wx-temps"));

            // Build out high and low temps
            selector += " .wx-temps";
            $(selector)
                .append($("<div/>").addClass("wx-highTemp"))
                .append($("<div/>").addClass("wx-lowTemp"));

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
    
    resolveTemp - Converts Yahoo supplied temperatures from F to C if such is
                    set

    ========================================================================= */
    function resolveTemp(temp) {
        var unit = wx_settings.unit;
        if (unit === 'c' || unit === 'C') {
            temp = '' + Math.round((parseInt(temp) - 32) / 1.8);
        }
        return temp;
    }   // resolveTemp()


    /* =========================================================================
    
    fillCurrently - Fills the current conditions

    ========================================================================= */
    function fillCurrently(currently) {
        // Root Selector for Current
        var wxRoot = wx_settings.wxContainer  + ' .' + wx_target.currently;
        var icon = $(wxRoot + ' .wx-icon');
        var desc = $(wxRoot + ' .wx-conditions .wx-desc');
        var temp = $(wxRoot + ' .wx-conditions .wx-temp');

        // Insert the current details. Icons may be changed by editing the icons array.
        if (icon.length) {
            icon.html(icons[currently.code]);
        }
        if (desc.length) {
            desc.html(currently.text);
        }
        if (temp.length) {
            temp.html(resolveTemp(currently.temp) + '&deg;' + wx_settings.unit.toUpperCase());
        }
    }   // fillCurrently()


    /* =========================================================================
    
    fillForecast - Fills the wx forecast
    
    @params
    wdx - index for weather display
    forecast - parsed forcast object

    ========================================================================= */
    function fillForecast(wdx, forecast) {
        var wxRoot = wx_settings.wxContainer;
        
        // If the cell is zero, it today so we want to populate the temps for Current field
        if (wdx === 0){
            wxRoot += ' .' + wx_target.currently;

            // Todays Name and Date
            var fdate = moment(forecast.date, "DD MMM YYYY");
            $( wxRoot + " .wx-day-name")
                .html(fdate.format('dddd, MMMM Do YYYY'))
                .addClass(getShift(fdate) + "-shift-outline");

            wxRoot += ' .wx-conditions'
                    + ' .wx-temps';

            // High Temp
            var fHighTemp = resolveTemp(forecast.high);
            if (parseInt(fHighTemp) >= wx_settings.highTemp){
                $( wxRoot + ' .wx-highTemp' ).addClass('wx-temp-hot');
            } else {
                $( wxRoot + ' .wx-highTemp' ).removeClass('wx-temp-hot');
            }
            $( wxRoot + ' .wx-highTemp' ).html(fHighTemp + '&deg;' + wx_settings.unit.toUpperCase());

            // Low Temp
            var fLowTemp = resolveTemp(forecast.low);
            if (parseInt(fLowTemp) <= wx_settings.lowTemp){
                $( wxRoot + ' .wx-lowTemp' ).addClass('wx-temp-cold');
            } else {
                $( wxRoot + ' .wx-lowTemp' ).removeClass('wx-temp-cold');
            }
            $( wxRoot + ' .wx-lowTemp' ).html(fLowTemp + '&deg;' + wx_settings.unit.toUpperCase());



        } else{
            wxRoot += ' .' + wx_target.forecast
                    + ' .day' + wdx.toString();

            // Generate Day Name
            var fdate = moment(forecast.date, "DD MMM YYYY");
            $( wxRoot + " .wx-day-name")
                .html(fdate.format('dddd'))
                .addClass(getShift(fdate) + "-shift-outline");

            // Generate Icon
            $( wxRoot + " .wx-icon").html(icons[forecast.code]);

                        // High Temp
            var fHighTemp = resolveTemp(forecast.high);
            if (parseInt(fHighTemp) >= wx_settings.highTemp){
                $( wxRoot + ' .wx-highTemp' ).addClass('wx-temp-hot');
            } else {
                $( wxRoot + ' .wx-highTemp' ).removeClass('wx-temp-hot');
            }
            $( wxRoot + ' .wx-highTemp' ).html(fHighTemp + '&deg;' + wx_settings.unit.toUpperCase());

            // Low Temp
            var fLowTemp = resolveTemp(forecast.low);
            if (parseInt(fLowTemp) <= wx_settings.lowTemp){
                $( wxRoot + ' .wx-lowTemp' ).addClass('wx-temp-cold');
            } else {
                $( wxRoot + ' .wx-lowTemp' ).removeClass('wx-temp-cold');
            }
            $( wxRoot + ' .wx-lowTemp' ).html(fLowTemp + '&deg;' + wx_settings.unit.toUpperCase());
        }

    }   // fillForecast()


    /* =========================================================================
    
    queryYahoo - Gets WX Data from Yahoo and displays it

    ========================================================================= */
    function queryYahoo() {
        $.ajax({
            type: 'GET',
            url: wx_settings.dataUrl + wx_settings.woeid + '&format=json',
            dataType: 'json'
        }).done(function (result) {
            // Drill down into the returned data to find the relevant weather information
            result = result.query.results.channel.item;

            var wxRoot = wx_settings.wxContainer;

            if ( $(wxRoot + " ." + wx_target.currently).length ){
                fillCurrently(result.condition);
            }

            if ( $(wxRoot + " ." + wx_target.forecast).length ){
                var maxForecasts = Math.min(result.forecast.length, forecastLength);
                for (var idx = 0; idx <= maxForecasts; idx++) {
                    fillForecast(idx, result.forecast[idx]);
                }

            }
        });
    }   // queryYahoo()


    /* =========================================================================
    
    goYahoo - Gets WX Data from Yahoo and displays it, refreshing every
        settings

    ========================================================================= */
    function goYahoo(interval) {
        interval = interval || wx_settings.wxQueryInterval;
        wx_settings.wxQueryInterval = interval;

        // Initial Yahoo data request
        queryYahoo();


        // Query Yahoo! at the requested interval for new weather data
        setInterval(function() {
            queryYahoo();
        }, wx_settings.wxQueryInterval);
    }   // goYahoo()


    // Now we export
    $.wx = wx;
    $.wx.queryYahoo = queryYahoo;
    $.wx.goYahoo = goYahoo;


})(jQuery);
