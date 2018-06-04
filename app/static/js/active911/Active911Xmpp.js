//Strophe.log=function(level, msg) { console.log("Strophe: "+level+": "+msg); };		// Debugging

/**
 * Active911Xmpp
 *
 * Wraps the XMPP BOSH code in something nicer for the Active911 to use
 * Note - depends on the global active911 object.  Maybe should clean this up later?
 */

function Active911Xmpp(param) {
	
	// Globals and defaults:
	var connection;
	var current_status=Strophe.Status.DISCONNECTED;
	var pings=[];
	var settings={
	
		"device_id"					:	0,
		"registration_code"			:	"",
		"server"					:	Active911Config.xmpp_server,
		"domain"					:	Active911Config.xmpp_domain,
		"conference_name"			:	Active911Config.xmpp_conference_name,
		"incoming_callback"			:	function(msg) {},
		"rooms"						:	[]
	};
	$.extend(settings,param);

	// Calculated settings
	settings.jid = "device" + settings.device_id + "@" + Active911Config.xmpp_domain;
	settings.nick = settings.device_id + "-" + Math.floor(Math.random()*10000);	

	/**
	 * Return the connection state
	 *
	 */
	this.is_connected=function(){
	
		return (current_status==Strophe.Status.CONNECTED);
	};
	/**
	 * Return the connection state
	 *
	 */
	this.is_connecting=function(){
	
		return (current_status==Strophe.Status.CONNECTING);
	};

	/**
	 * Return the disconnection state
	 *
	 */
	this.is_disconnected=function(){
	
		return (current_status==Strophe.Status.DISCONNECTED);
	};

	/**
	 * Connect to XMPP
	 * Optional: Callback to pass along connection state changes
	 */
	this.connect= function(callback) {

		connection= new Strophe.Connection("https://"+settings.server+":5280/http-bind/");
		connection.connect(settings.jid, settings.registration_code, function(status) {
			console.log("JID: " + settings.jid);
			console.log("Reg:" + settings.registration_code);
			
			if(callback){
				callback(status);
			}
			// Handle changes in connection state
			current_status=status;
			//console.log("XMPP status change: "+status);
			if (status == Strophe.Status.DISCONNECTED) {
			
				// Begin reconnect?
			
			} else if (status == Strophe.Status.CONNECTED) {
			

				// Add handler for incoming group notifications
				connection.addHandler(function(msg) {
					

					//try{
					
						// Get sending agency
						var from=msg.attributes.getNamedItem("from").value;
						
						// Discard messages echoed back to ourself
						/*if(Strophe.getResourceFromJid(from)==settings.nick) {
						
							return true;
						}*/
						var agency_id=parseInt(from.substring(0,from.indexOf("@")));
						var text="";
						Strophe.forEachChild(msg,"body",function(element) { text+=Strophe.getText(element); } );
						settings.incoming_callback(parse_message(text,agency_id));
						console.log("MESSAGE-GROUPCHAT from agency "+agency_id);
						
					//} catch(e) {
					
					//	console.log("Exception in MESSAGE-GROUPCHAT:" +e.message);
					//};

					return true;
				}, null, 'message', 'groupchat', null, null);

				// Add handler for incoming direct messages
				connection.addHandler(function(msg) {
					
					console.log("MESSAGE-DIRECTCHAT");

					var text="";
					Strophe.forEachChild(msg,"body",function(element) { text+=Strophe.getText(element); } );
					settings.incoming_callback(parse_message(text));
					return true;
					}, null, 'message', 'chat', null, null);
					
				// Add handler for incoming pings
				connection.addHandler(function(msg) {

					try{
						// Get ping ID
						var ping_id=msg.attributes.getNamedItem("id").value;
						
						// Notify the matching ping
						for (var i in pings) {
						
							if(pings[i].matches_received_id(ping_id)) {
							
								// Found.  Complete ping and remove from array
								pings[i].complete();
								pings.splice(i,1);
								break;
							}
						}
						
					} catch(e) {};
					
					return true;
					}, null, 'iq', 'result', null, null);
					
								
				// Send presence, join agency rooms
				connection.pause();
				connection.send($pres().tree());
				for (var i in settings.rooms) {
				
					var pres=$pres({
						to: settings.rooms[i]+"@"+settings.conference_name+"/"+settings.nick,
						from: connection.jid
						})
						.c("x", {xmlns: 'http://jabber.org/protocol/muc'});
						
					connection.send(pres.tree());
				}
				connection.resume();
			}
		
		});	

	};


	/**
	 * Disconnect from XMPP
	 *
	 */
	this.disconnect=function () {

		// Leave rooms
		connection.pause();
		for (var i in settings.rooms) {
		
			var pres=$pres({
				to: settings.rooms[i]+"@"+settings.conference_name+"/"+settings.nick,
				from: connection.jid,
				type: "unavailable"
				})
				.c("x", {xmlns: 'http://jabber.org/protocol/muc'});
				
			connection.send(pres.tree());
		}
		connection.resume();
		connection.flush();	// Send pending data
		connection.disconnect();

	};
	
	/**
	 * Ping XMPP server (XEP 199)
	 *
	 * @param opts {success: a callback for successful completion, failure: failure callback, timeout: a timeout val in msec }
	 */
	 this.ping=function(opts) {
	 
		var ping_id=new Date().getTime();
	 
		var ping=$iq({
		
			from: connection.jid,
			type: "get",
			to:	settings.domain,
			id:	ping_id
			
		}).c("ping", {xmlns: 'urn:xmpp:ping'});
		
		connection.send(ping.tree());
		connection.flush();
		pings.push(new Active911XmppPing($.extend(opts,{"id": ping_id, "timestamp": new Date().getTime() })));
	 
	 };
	
	/**
	 * Send a message
	 *
	 * @param message the message to send
	 * @agency_id the agency ID we send to (defaults to all)
	 */
	 this.send_message=function(message, agency_id) {
	 
		// Make sure we are connected
		if(!this.is_connected()) {
			
			return;
		}
		
		// Find destination(s)
		var destination_rooms=[];
		if(typeof(agency_id)=="number") {
			
			if(settings.rooms.indexOf(agency_id)>=0) {
			
				destination_rooms.push(agency_id);
			} else {
			
				console.log("Bad agency ID specified: "+agency_id);
				return;
			}
		} else {
		
			destination_rooms=settings.rooms;
		}
		
		connection.pause();
		for (var i in destination_rooms) {
		
			var $message=$msg({
				to: destination_rooms[i]+"@"+settings.conference_name,
				from: connection.jid,
				type: "groupchat",
				body: "Hello, World!"
				}).c("body",message);
				
			connection.send($message.tree());
		}		
	 	connection.resume();	

	 };
	

	/**
	 * Send a position stanza
	 *
	 * @param lat
	 * @param lon
	 * @param error the error in meters
	 */
	this.send_position=function(lat, lon, error) {
	
		// Make sure the response is valid
		if(typeof(lat) != "number" || typeof(lon) != "number" || typeof(error) != "number") {
			
				return;
		}
				
		lat=Math.round(lat*100000000)/100000000;
		lon=Math.round(lon*100000000)/100000000;
		error=Math.round(error);

		// Make sure error isn't too bad
		if(error >= 100) {
		
			console.log("Rejecting position with error of "+error+" meters");
			return;
		}
	
		this.send_message("response:"+active911.device.info.device_id+":position:"+lat+","+lon+","+error+":via Webview");
	};
	
	
	/** 
	 * Parse an incoming message
	 *
	 * Group (conference) messages have the following format:
	 * command:device_id:action:alert_id:other
	 * response:33:respond:3003:via WebApp
	 * response:33:position:40.34,-123.23,5:via WebApp
	 * response:2:position:44.593797,-123.282425,70.407247:via iOS (direct)
	 * alert:123456:ALARM
	 * assignment:hex string:1
	 *
	 * Direct messages use the following format and must be retrieved using the ID:
	 * message:message_id:alert_id:soundfile:message text
	 *
	 * @param text the textual message to be parsed
	 * @retval o the parsed object - typically {command:device_id:action:alert_id:other}
	 */
	 function parse_message(text, agency_id) {
	 
		var o={
			"command"		:	"unknown",
			"agency_id"		:	((typeof agency_id == "number")?agency_id:0),
			"device_id"		:	0,
			"action"		:	"",
			"alert_id"		:	0,
			"message_id"	:	0,
			"sound"			:	"",
			"message"		:	"",
			"assignment_id":"0000000000000000",
			};
	 
		try {
			var components=text.split(":");
			switch(components[0]) {
			
			case "assignment":
				o.command = "assignment";
				o.device_id = parseInt(components[1]);
				o.agency_id = parseInt(agency_id);
				o.assignment_id = components[2];
				break;
			case "message":
				o.command="message";
				o.message_id=parseInt(components[1]);
				o.alert_id=parseInt(components[2]);
				o.sound=components[3];
				o.message=components[4];
				break;
			case "response":
				if(components[2]=="position") {
				
					var position=components[3].split(",");
					o.command="position";
					o.device_id=parseInt(components[1]);
					o.lat=position[0];			
					o.lon=position[1];			
				
				} else {
				
					o.command="response";
					o.device_id=parseInt(components[1]);
					o.action=components[2];
					o.alert_id=parseInt(components[3]);
				}
				break;
			case "popup":

				o.command="popup";
				o.device_id=parseInt(components[1]);
				o.message=components[2];
			break;
			default:
				o.other=text;	/* HACK */
			}
		
		} catch(e) {
		
			o.message="Error parsing message";
		};
		
		return o;
	 }
	 

};
