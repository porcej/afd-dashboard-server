
/***

Fire Service Dashboarding Services
Copyright 2017 Joseph Porcelli
0.0.1

***/



(function ($, moment, L) {
	"use strict";
	

    /* =========================================================================
    
    getShift = given a date (moments) determines which shift is working

    ========================================================================= */
	function getShift( date ){

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
							return sdx.toString() + "-shift-outline";
						}
					}
				}
			}
		}

		return '';
		
	}	// getShift()




	$( document ).ready(function() {
		// Display clock and date
		$.clock({
			dateClassifier: getShift,
            updateDateClassifer: function(target, date){
            	target = target || '';
            	date = date || moment();

                var allShiftClasses = "a-shift-outline b-shift-outline c-shift-outline";
                var shiftClass = getShift(date);
                var tidyShiftClasses = allShiftClasses.replace(shiftClass);


                $( target ).addClass(shiftClass);
                $( target ).removeClass(tidyShiftClasses);
            }

		});

		// Handle WX Forecast Display
		$.wx({woeid: 2353019});	// Alexandria City	Virginia	United States
		$.wx.goYahoo();


		// Load Telestaff
		$.webstaff({});


		// Initiate Leaflet map
		$.alertMap = L.map('alertMap', { zoomControl:false, attributionControl:false }).setView([38.8109981,-77.0910554], 17);
		
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
									 '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
									 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'mapbox.streets'
		}).addTo($.alertMap);
			
		$.alertMap.currentCallMarker = L.marker([38.8109981,-77.0910554]).addTo($.alertMap);
			
		$('#alertModal').on('shown.bs.modal', function (e) {
	  		$.alertMap.invalidateSize();
		});

	});

})(jQuery, moment, L);