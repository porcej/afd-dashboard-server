

/*

Accuweather info:
	base url: https://developer.accuweather.com/apis
	Forecast url: https://developer.accuweather.com/accuweather-forecast-api/apis/
	Alerts url: https://developer.accuweather.com/accuweather-alerts-api/apis
	api_key: OGWxp6lUGhtADfo56frZkZAAzF9bDFSf
	Location code (22305): 9237_PC
	Location code (22315): 9247_PC

Weather Underground
	https://www.wunderground.com/weather/api/d/docs?d=data/alerts&MR=1


*/






(function() {
	'use strict';
	/*global $, moment*/

	/*************************************************************************/
	/*****************************************************/
	/*********************************/
	// USER EDITABLE LINES - Change these to match your location and preferences!

	// Your Yahoo WOEID code
	// Find your WOEID code at http://zourbuth.com/tools/woeid/
	var woeid = 2353019;	// Alexandria City	Virginia	United States

	
	// Your temperature unit measurement
	// This bit is simple, 'c' for Celcius, and 'f' for Fahrenheit
	var unit = 'F';
	
	// Format for date and time
	var formatTime = 'HH:mm:ss'
	var formatDate = 'dddd, MMMM Do YYYY'

	// Yahoo! query interval (milliseconds)
	// Default is every 15 minutes. Be reasonable. Don't query Yahoo every 500ms.
	var waitBetweenWeatherQueriesMS = 900000;

	// You're done!
	/*********************************/
	/*****************************************************/
	/*************************************************************************/

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
		
	};	/* getShift() */

	function resolveTemp(temp) {
		if (unit === 'c' || unit === 'C') {
			temp = '' + Math.round((parseInt(temp) - 32) / 1.8);
		}
		return temp;
	}

	function fillCurrently(currently) {
		var icon = $('#currently .icon');
		var desc = $('#currently .desc');
		var temp = $('#currently .temp');

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
	}

	function fillForecast(wdx, forecast) {
					var icons = [
				'<i class="wi wi-tornado"></i>',			//tornado
				'<i class="wi wi-rain-wind"></i>',			//tropical storm
				'<i class="wi wi-tornado"></i>',			//hurricane
				'<i class="wi wi-thunderstorm"></i>',		//severe thunderstorms
				'<i class="wi wi-thunderstorm"></i>',		//thunderstorms
				'<i class="wi wi-rain-mix"></i>',			//mixed rain and snow
				'<i class="wi wi-rain-mix"></i>',			//mixed rain and sleet
				'<i class="wi wi-rain-mix"></i>',			//mixed snow and sleet
				'<i class="wi wi-rain-mix"></i>',			//freezing drizzle
				'<i class="wi wi-cloudy"></i>',				//drizzle
				'<i class="wi wi-rain"></i>',				//freezing rain
				'<i class="wi wi-rain"></i>',				//showers
				'<i class="wi wi-rain"></i>',				//showers
				'<i class="wi wi-snow"></i>',				//snow flurries
				'<i class="wi wi-snow"></i>',				//light snow showers
				'<i class="wi wi-showers"></i>',			//blowing snow
				'<i class="wi wi-snow"></i>',				//snow
				'<i class="wi wi-hail"></i>',				//hail
				'<i class="wi wi-rain-mix"></i>',			//sleet
				'<i class="wi wi-dust"></i>',				//dust
				'<i class="wi wi-fog"></i>',				//foggy
				'<i class="wi wi-day-haze"></i>',			//haze
				'<i class="wi wi-smoke"></i>',				//smoky
				'<i class="wi wi-strong-wind"></i>',		//blustery
				'<i class="wi wi-strong-wind"></i>',		//windy
				'<i class="wi wi-snowflake-cold"></i>',		//cold
				'<i class="wi wi-cloudy"></i>',				//cloudy
				'<i class="wi wi-night-cloudy"></i>',		//mostly cloudy (night)
				'<i class="wi wi-day-cloudy"></i>',			//mostly cloudy (day)
				'<i class="wi wi-night-cloudy"></i>',		//partly cloudy (night)
				'<i class="wi wi-day-cloudy"></i>',			//partly cloudy (day)
				'<i class="wi wi-night-clear"></i>',		//clear (night)
				'<i class="wi wi-day-sunny"></i>',			//sunny
				'<i class="wi wi-night-clear"></i>',		//fair (night)
				'<i class="wi wi-day-sunny"></i>',			//fair (day)
				'<i class="wi wi-hail"></i>',				//mixed rain and hail
				'<i class="wi wi-hot"></i>',				//hot
				'<i class="wi wi-storm-showers"></i>',		//isolated thunderstorms
				'<i class="wi wi-storm-showers"></i>',		//scattered thunderstorms
				'<i class="wi wi-storm-showers"></i>',		//scattered thunderstorms
				'<i class="wi wi-showers"></i>',			//scattered showers
				'<i class="wi wi-sleet"></i>',				//heavy snow
				'<i class="wi wi-snow"></i>',				//scattered snow showers
				'<i class="wi wi-sleet"></i>',				//heavy snow
				'<i class="wi wi-cloudy"></i>',				//partly cloudy
				'<i class="wi wi-storm-showers"></i>',		//thundershowers
				'<i class="wi wi-snow"></i>',				//snow showers
				'<i class="wi wi-storm-showers"></i>'		//isolated thundershowers
			];
		// Choose one of the five forecast cells to fill


		// <div class="row accu forecast1 forecast">
		// 	<div class="title"></div>
		// 	<div class="icon-day"></div><div class="icon-night"></div>
		// 	<div class="desc"></div>
		// 	<div class="highTemp"><i class="fa fa-arrow-up" aria-hidden="true"></i>  <span class="high"></span></div>
		// 	<div class="lowTemp"><i class="fa fa-arrow-down" aria-hidden="true"></i> <span class="low"></span></div>
		// </div>

		// var forecastCell = '.forecast' + day + ' ';
		// var day = $(forecastCell + '.day');
		// var icon = $(forecastCell + '.icon');
		// var desc = $(forecastCell + '.desc');
		// var high = $(forecastCell + '.high');
		// var low = $(forecastCell + '.low');




		var forecastCell = '.forecast' + wdx + ' ';
		var day = $(forecastCell + '.title');
		var icon = $(forecastCell + '.wx-icon');
		var desc = $(forecastCell + '.desc');
		var high = $(forecastCell + '.high');
		var low = $(forecastCell + '.low');

		// If this is the first cell, call it "Today" instead of the day of the week
		if (day.length) {
			if (wdx === 1) {
				day.html('Today');
			} else {
				day.html(forecast.day);
			}
			day.addClass(getShift(moment(forecast.date, "DD MMM YYYY")) + "-shift-outline");
			console.log(getShift(moment(forecast.date, "DD MMM YYYY")) + "-shift-outline");
		}

		// Insert the forecast details. Icons may be changed by editing the icons array.
		// if (icon.length) {
		// 	icon.html(icons[forecast.code]);
		// }
		if (icon.length){
			icon.html(icons[forecast.code]);
		}
		if (desc.length) {
			desc.html(forecast.text);
		}
		if (high.length) {
			var fHighTemp = resolveTemp(forecast.high);
			if (parseInt(fHighTemp) >= 90){
				high.addClass('btn-danger');
			} else {
				high.removeClass('btn-danger');
			}
			high.html('<i class="fa fa-arrow-up" aria-hidden="true"></i> ' + fHighTemp + '&deg;' + unit.toLowerCase());
		}
		if (low.length) {
			var fLowTemp = resolveTemp(forecast.low);
			if (parseInt(fLowTemp) <= 40){
				low.addClass('btn-primary');
			} else {
				low.removeClass('btn-primary');
			}
			low.html(' <i class="fa fa-arrow-down" aria-hidden="true"></i> ' + fLowTemp + '&deg;' + unit.toLowerCase());
		}
	}

	function fillLinks(link) {
		// Linking is required attribution when using Yahoo! APIs
		if ($('.yahooLink').length) {
			$('.yahooLink').attr('href', link);
		}
	}

	function queryYahoo() {
		$.ajax({
			type: 'GET',
			url: 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%3D' + woeid + '&format=json',
			dataType: 'json'
		}).done(function (result) {
			// Drill down into the returned data to find the relevant weather information
			result = result.query.results.channel.item;

			fillCurrently(result.condition);
			fillForecast(1, result.forecast[0]);
			fillForecast(2, result.forecast[1]);
			fillForecast(3, result.forecast[2]);
			fillForecast(4, result.forecast[3]);
			fillForecast(5, result.forecast[4]);
			fillLinks(result.link);
		});
	}

	// Fallback icons - Do not edit. Icons should be edited in your current skin.
	// Fallback icons are from the weather icons pack on github at https://github.com/erikflowers/weather-icons
	// Position in array corresponds to Yahoo! Weather's condition code, which are commented below in plain English
	// if (!icons) {
	// 	$(document).ready(function() {

	// }

	$( document ).ready(function() {

		$('head').append('<link rel="stylesheet" type="text/css" href="assets/css/weather-icons.css" />');



		$.wx('OGWxp6lUGhtADfo56frZkZAAzF9bDFSf');
		// $.wx.getForecast('9237_PC');

		// Fetch the weather data for right now
		queryYahoo();

		// Query Yahoo! at the requested interval for new weather data
		setInterval(function() {
			queryYahoo();
		}, waitBetweenWeatherQueriesMS);

		// Set the current time and date on the clock



		$( '.cb-clock').each(function(idx){
			var timeStr = moment().format(formatTime);
			$( this ).append($( "<div/>" ).addClass("cb-time").html(timeStr));

			timeStr = timeStr.replace(/[a-z0-9]/gmi, '8');	// Build the background time string

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


		// html(timeStr);


		$( '.cb-date' ).each(function( idx ) {
			$( this ).addClass(getShift() + "-shift-outline");
			$( this ).html(moment().format(formatDate));
		});


		// $( '.cb-time' ).each(function( idx ) {
			
		// 	$( this ).html(moment().format(timeStr));

		// 	timeStr = timeStr.replace(/[a-z0-9]/gmi, '8');
		// 	$( this ).after($("<div/>").addClass("")
		// 		)
		// 	$( this ).html(timeStr);

		// });
		// if ($('#time').length) {
			

		// }
		// if ($('#date').length) {
		// 	$('#date').html(moment().format(formatDate));
		// }

		// Refresh the time and date every second
		setInterval(function(){
			$( '.cb-time' ).each(function( idx ) {
				$( this ).html(moment().format(formatTime));
			});
			$( '.cb-date' ).each(function( idx ) {
				$( this ).html(moment().format(formatDate));
				var allShiftClasses = "a-shift-outline b-shift-outline c-shift-outline";
				var shiftClass = getShift() + "-shift-outline";
				var tidyShiftClasses = allShiftClasses.replace(shiftClass);


				$( this ).addClass(shiftClass);
				$( this ).removeClass(tidyShiftClasses);
				// $( this ).attr('class', 'cleanstate');
			});
		}, 1000);
	});
}());


/////////// Example return data from Yahoo! Weather ///////////////////////////
/*
	"title": "Conditions for Rolla, MO at 2:52 pm CST",
	"lat": "37.95",
	"long": "-91.76",
	"link": "http:\/\/us.rd.yahoo.com\/dailynews\/rss\/weather\/Rolla__MO\/*http:\/\/weather.yahoo.com\/forecast\/USMO0768_f.html",
	"pubDate": "Wed, 11 Feb 2015 2:52 pm CST",
	"condition": {
		"code": "26",
		"date": "Wed, 11 Feb 2015 2:52 pm CST",
		"temp": "37",
		"text": "Cloudy"
	},
	"description": "\n<img src=\"http:\/\/l.yimg.com\/a\/i\/us\/we\/52\/26.gif\"\/><br \/>\n<b>Current Conditions:<\/b><br \/>\nCloudy, 37 F<BR \/>\n<BR \/><b>Forecast:<\/b><BR \/>\nWed - Partly Cloudy. High: 41 Low: 17<br \/>\nThu - Sunny. High: 29 Low: 19<br \/>\nFri - Partly Cloudy. High: 47 Low: 28<br \/>\nSat - Partly Cloudy. High: 36 Low: 9<br \/>\nSun - AM Clouds\/PM Sun. High: 29 Low: 20<br \/>\n<br \/>\n<a href=\"http:\/\/us.rd.yahoo.com\/dailynews\/rss\/weather\/Rolla__MO\/*http:\/\/weather.yahoo.com\/forecast\/USMO0768_f.html\">Full Forecast at Yahoo! Weather<\/a><BR\/><BR\/>\n(provided by <a href=\"http:\/\/www.weather.com\" >The Weather Channel<\/a>)<br\/>\n",
	"forecast": [
		{
			"code": "29",
			"date": "11 Feb 2015",
			"day": "Wed",
			"high": "41",
			"low": "17",
			"text": "Partly Cloudy"
		},
		{
			"code": "32",
			"date": "12 Feb 2015",
			"day": "Thu",
			"high": "29",
			"low": "19",
			"text": "Sunny"
		},
		{
			"code": "30",
			"date": "13 Feb 2015",
			"day": "Fri",
			"high": "47",
			"low": "28",
			"text": "Partly Cloudy"
		},
		{
			"code": "30",
			"date": "14 Feb 2015",
			"day": "Sat",
			"high": "36",
			"low": "9",
			"text": "Partly Cloudy"
		},
		{
			"code": "30",
			"date": "15 Feb 2015",
			"day": "Sun",
			"high": "29",
			"low": "20",
			"text": "AM Clouds\/PM Sun"
		}
	],
	"guid": {
	"isPermaLink": "false",
	"content": "USMO0768_2015_02_15_7_00_CST"
*/
