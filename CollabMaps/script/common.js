$(document).ready(function() {
    $("#btn_addmarker").button({
        text: false
    }).click(function() {
        StreetViewer.addMarker();
    });
	
	$("#cmdSelectApp2App").click(function(){
	  webinos.dashboard.open({
			module: 'explorer',
			data: {
				service: ['http://webinos.org/api/app2app'],
				select: "devices"
			}
		}).onAction(function (data) {
			if (typeof localStorage != "undefined") {
				localStorage.setItem("app2appApi_zoneId", data.result[0].id);
			}
		});
	});

    $("#dlg_login").dialog({
        autoOpen: true,
        draggable: true,
        modal: true,
        title: "Login as...",
        buttons: {
            "Host": function() {
                StreetViewer.init('host', function(connected) {
                    if (connected) {
                        console.log("Connected");
                    }
                }, $("#txt_channelid").val());

                $("#btn_addmarker").css("display", "block");

                $(this).dialog("close");
            },
            "Guest": function() {
                StreetViewer.init('guest', function(connected) {
                    if (connected) {
                        console.log("Connected");
                    }
                }, $("#txt_channelid").val());

                $("#btn_addmarker").css("display", "block");

                $(this).dialog("close");
            }
        }
    });
});

$(window).unload(function() {
    console.log("unloading");
    StreetViewer.close();
});