/** 
 * TimerController
 *
 * Here's my attempt at a master race of timer controllers.  This object can be called to add timers.
 */

function TimerController() {
	
		var timers=[];
		
		/**
		 * Add a timer
		 * @param name the timer name
		 * @param callback function to call upon completion
		 * @param seconds how often to call it
		 * timer_name is to prevent multiple registrations; the controller will maintain singleton copies of any member timers.
		 * the timer is removed automatically if callback returns false		 
		 */
		this.add = function (name, callback, seconds) {
		
			// If this name already exists, delete the predecessor
			for (var i in timers) {
			
				if(timers[i].name == name) {
				
					timers.splice(i,1);
				}	
			}
		
			timers.push({ "name" : name, "callback" :  callback, "interval": seconds, "counter": 0 });
		};
		
		/** 
		 * Return the number of seconds remaining for a timer
		 *
		 * @param name the name of the timer
		 * @retval the number of seconds before next event
		 */
		this.seconds_remaining=function(name) {
		
		
			for (var i in timers) {
			
				if(timers[i].name == name) {
				
					return timers[i].interval-timers[i].counter;
				}	
			}		
		
			return false;		
		
		};
		
		/**
		 * Check whether a given timer exists
		 *
		 * @param name the name of the timer we are checking
		 * @retval boolean
		 */
		this.exists=function(name) {
		
			for (var i in timers) {
			
				if(timers[i].name == name) {
				
					return true;
				}	
			}		
		
			return false;
		};
		
		/**
		 * Remove all timers
		 *
		 */
		 this.remove_all=function() {
		 
			timers=[];
		 
		 };
		
		setInterval(function() {
					
			// Loop through all timers.  
			for (var i=0; i < timers.length; i++) {		// Local scope in i is super important here! Since callback might modify i
			
				// Update each counter
				timers[i].counter++;
				
				// Is this timer due?
				if(timers[i].counter >= timers[i].interval) {
				
					// Yes.  Call it.  If it returns false, remove it from the timers array.
					timers[i].counter=0;
					if(false==timers[i].callback()) {
						
						timers.splice(i,1);
					}
				}
			}
		
		},1000);
	
}