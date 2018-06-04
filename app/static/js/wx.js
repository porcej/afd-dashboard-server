
/***

jQuery Yahoo Weather API (wx.js)

An lite-weight Yahoo Weather API
Copyright 2017 Joseph Porcelli
0.0.2

***/


(function ($) {
    'use strict';

    var wx_settings = {
        apikey: '',
        woeid: 0,
        unit: 'F',
        wxQueryInterval: 900000,
        forecastTarget: '.wx-forecast',
        currentlyTarget: '.wx-currently'
    };

    var forecastLength = 1;

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
        scaffoldCurrent();
        // $('head').append('<link rel="stylesheet" type="text/css" href="static/css/weather-icons.css" />');
        
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
    
    scaffoldWXDay - Builds HTML to support a forecast for single day

    ========================================================================= */
    function scaffoldWXDay(day, target){
        target = target || wx_settings.forecastTarget;
        wx_settings.forecastTarget = target;

        if (day >= 0){
            if ( $( target ).length ){

                $(target).append(
                    $("<div/>").addClass("container forecast forecast"
                                         + day.toString()).html(`
<div class="card wx-card">
  <div class="card-header wx-title"></div>
  <div class="card-body">
    <div class="container">
      <div class="row">
        <div class="col">
          <div class="wx-icon"></div>
        </div>
        <div class="col align-middle">
          <div class="wx-high"></div>
          <div class="wx-low"></div>
        </div>
      </div>
    </div>
    <h5 class="card-title wx-desc text-center"></h5>
  </div>
</div>    




`));

            }
        }
        return this;    // we support chaining
    }   // scaffoldWXDay()



    /* =========================================================================
    
    scaffoldWX - Builds out the HTML to support WX, in target

    ========================================================================= */
    function scaffoldWX(target){
        for (var ddx = 0; ddx < forecastLength ; ddx++) {
            scaffoldWXDay(ddx, target);
        }

        return this;    // we support chaining
    }   // scaffoldWX()


    /* =========================================================================
    
    scaffoldCurrent - Builds out the HTML to support WX, in target

    ========================================================================= */
    function scaffoldCurrent(target){
        target = target || wx_settings.currentlyTarget;
        wx_settings.currentlyTarget = target;

        if ( $( target ).length ){

            $(target).append($("<div/>").addClass("row currently").html(`
                <div class="wx-icon"></div>
                <div class="wx-desc"></div>
                <div class="wx-temp"></div>`));
        }

        return this;    // we support chaining
    }   // scaffoldCurrent()


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
        var icon = $('#currently .wx-icon');
        var desc = $('#currently .wx-desc');
        var temp = $('#currently .wx-temp');

        // Insert the current details. Icons may be changed by editing the icons array.
        if (icon.length) {
            icon.html(icons[currently.code]);
        }
        if (desc.length) {
            desc.html(currently.text);
        }
        if (temp.length) {
            temp.html(resolveTemp(currently.temp));
        }
    }   // fillCurrently()


    /* =========================================================================
    
    fillForecast - Fills the wx forecast
    
    @params
    wdx - index for weather display
    forecast - parsed forcast object

    ========================================================================= */
    function fillForecast(wdx, forecast) {
        var forecastCell = '.forecast' + wdx;

        if ( $(forecastCell).length == 0){
            scaffoldWXDay(wdx);
        }
        var day = $(forecastCell + ' .wx-title');
        var icon = $(forecastCell + ' .wx-icon');
        var desc = $(forecastCell + ' .wx-desc');
        var high = $(forecastCell + ' .wx-high');
        var low = $(forecastCell + ' .wx-low');
        var wind = $(forecastCell + ' .wx-wind');



        // If this is the first cell, call it "Today" instead of the day of the week
        if (day.length) {
            var fdate = moment(forecast.date, "DD MMM YYYY");
            if (wdx === 0) {
                day.html('Today');
            } else {
                // day.html(forecast.day);
                day.html(fdate.format('dddd, MMMM Do YYYY'))
            }
            day.addClass(getShift(fdate) + "-shift-outline");
        }

        if (icon.length){
            icon.html(icons[forecast.code]);
        }
        if (desc.length) {
            desc.html(forecast.text);
        }
        if (high.length) {
            var fHighTemp = resolveTemp(forecast.high);
            if (parseInt(fHighTemp) >= 90){
                high.addClass('wx-temp-hot');
            } else {
                high.removeClass('wx-temp-hot');
            }
            high.html('<i class="fa fa-arrow-up" aria-hidden="true"></i> ' + fHighTemp + '&deg;' + wx_settings.unit.toLowerCase());
        }
        if (low.length) {
            var fLowTemp = resolveTemp(forecast.low);
            if (parseInt(fLowTemp) <= 40){
                low.addClass('wx-temp-cold');
            } else {
                low.removeClass('wx-temp-cold');
            }
            low.html(' <i class="fa fa-arrow-down" aria-hidden="true"></i> ' + fLowTemp + '&deg;' + wx_settings.unit.toLowerCase());
        }
      
      wind.html('<i class="wi wi-strong-wind" aria-hidden="true"></i>')
    }   // fillForecast()


    /* =========================================================================
    
    queryYahoo - Gets WX Data from Yahoo and displays it

    ========================================================================= */
    function queryYahoo() {
        $.ajax({
            type: 'GET',
            url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%3D' + wx_settings.woeid + '&format=json',
            dataType: 'json'
        }).done(function (result) {
            // Drill down into the returned data to find the relevant weather information
            result = result.query.results.channel.item;

            if ( $(wx_settings.currentlyTarget).length ){
                fillCurrently(result.condition);
            }

            if ( $(wx_settings.forecastTarget).length ){
                for (var idx = 0; idx < result.forecast.length; idx++) {
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
