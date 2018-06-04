	// Returns the number of days between Dates first and second.
	dayDiff = function(first, second) {
	    return Math.round(Math.abs(second-first)/(1000*60*60*24));
	};	// _dayDiff


	// Determines what shift is working on date
	this._getShift = function( date ){

		date = date || moment();

		// First we clean up date by dropping hours, minutes and seconds
		date = moment( date.getFullYear(), date.getMonth(), date.getDate() );

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
						var d = date.diff(shiftMap[sdx][ddx]);
						if (d % 9 === 0 ) {
							return sdx;
						}
					}
				}
			}
		}

		return '';
		
	};	/* this._getShift() */