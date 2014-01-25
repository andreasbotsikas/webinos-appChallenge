var once = false;
var eventService = null;

var callback = {};

callback.onSending = function(event, recipient) {
	//params.event, params.recipient
	console.log("onSending() to " + recipient);
};
callback.onCaching = function(event) {
	//params.event
	console.log("onCaching()");
};
callback.onDelivery = function(event, recipient) {
	//params.event, params.recipient
	console.log("onDelivery() at " + recipient);
};
callback.onTimeout = function(event, recipient) {
	//params.event, params.recipient
	console.log("onTimeout()");
};
callback.onError = function(event, recipient, error) {
	//params.event, params.recipient, params.error
	console.log("onError()" + error + " recipient: " + recipient);
};

function find() {
    var zoneId;
    if (typeof localStorage != "undefined" && localStorage.getItem("eventsApi_zoneId") != null) {
        zoneId = {
            zoneId: [localStorage.getItem("app2appApi_zoneId")]
        };
    }
	webinos.discovery.findServices(new ServiceType("http://webinos.org/api/events"), {
		onFound : on_service_found
    }, null, zoneId);
}

function on_service_found(service) {
	console.log("found: " + service.serviceAddress);
	if (!once) {
		once = true;
		bind(service);
	} /* else { // Events API can be on multiple devices
		tiledSurface.connected = false;
		tiledSurface.setState(tiledSurface.Status.LOGIN);
		console.log("Not bound : " + service.serviceAddress);
	}*/
}

function bind(service) {
	service.bindService({
		onBind : function(boundService) {
			eventService = boundService;
			console.log("Bound service: " + eventService.serviceAddress);
			console.log("My App ID: " + eventService.myAppID);
			
			tiledSurface.connected = true;
			tiledSurface.addHandlers();
            tiledSurface.setState(tiledSurface.Status.PAIRING);
            
            channelMaps.addHandlers();
		}
	});
}

 function openDashboard() {
     once = false; // Reset the once to be able to rebind to new service (although events will be coming from the previous source too
     $("#selectedServer").text("");
     if (typeof localStorage != "undefined") {
         localStorage.removeItem("eventsApi_zoneId");
         webinos.dashboard.open({
             module: 'explorer',
             data: {
                 service: ['http://webinos.org/api/events'],
                 select: "devices"
             }
         }).onAction(function (data) {
             if (typeof localStorage != "undefined" && data.result.length == 1) {
                 localStorage.setItem("eventsApi_zoneId", data.result[0].id);
                 $("#selectedServer").text("Current selection: " + data.result[0].id);
             }
         });
     } else {
         $("#selectedServer").text("Your renderer doesn't support localstorage!");
     }
}