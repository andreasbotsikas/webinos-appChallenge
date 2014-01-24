webinosConnector = function (applicationName) {
    var connectedDevices = { pzh: {}, pzp: {}, myPzp: {} };
    this.getConnectedDevices = function () {
        return connectedDevices;
    };
    var that = this;
    var connectorState = 0;
    this.STATE = {
        ERROR: -1,
        INIT: 0,
        VIRGIN: 1,
        PZH_OFFLINE: 2,
        PZH_ONLINE: 3
    };
    var internalEventType = {};
    var connectorServices = {
        events: { listenerId: null, service: null, id: null }
    };

    var triggerEvent = function (event, paramArray) {
        console.log("Will trigger the " + event);
        if (typeof paramArray == null)
            $(that).trigger(event);
        $(that).trigger(event, paramArray);
    };
    var setState = function (state) {
        if (state == connectorState) return;
        var oldState = connectorState;
        connectorState = state;
        triggerEvent('statusChange', [state, oldState]);
    };
    this.getState = function () {
        return connectorState;
    };
    this.on = function (event, handler, scope) {
        if (typeof handler !== 'function') return false;
        $(that).on(event, function () {
            var args = Array.prototype.slice.call(arguments, 1);
            handler.apply(scope || window, args);
        });
        return true;
    };
    this.broadcast = function (type, data) {
        if (this.getState() != this.STATE.PZH_ONLINE) return false;
        var ev = connectorServices.events.service.createWebinosEvent();
        ev.type = preventCollision(type);
        ev.payload = data;
        ev.dispatchWebinosEvent();
        return true;
    };
    var preventCollision = function (type) {
        var result = applicationName + hash(applicationName + type);
        return result;
    };
    var eventReceived = function (event) {
        switch (event.type) {
            case internalEventType.ping:
                if (event.addressing.source.id === connectorServices.events.service.myAppID) {
                    ponged(event.payload, event.addressing.source.id);
                } else {
                    pong(event.payload);
                }
                return;
            case internalEventType.pong:
                if (event.addressing.source.id === connectorServices.events.service.myAppID) {
                    return;
                }
                ponged(event.payload, event.addressing.source.id);
                break;
            case internalEventType.hello:
                that.ping();
                break;
            default:
                if (event.addressing.source.id === connectorServices.events.service.myAppID) {
                    return;
                } else {
                    console.log('new event:');
                    console.log(event);
                    var e = {
                        from: event.addressing.source.id,
                        self: (event.addressing.source.id === connectorServices.events.service.myAppID) ? true : false,
                        data: event.payload
                    };
                    triggerEvent('_event_' + event.type, e);
                }
                break;
        }
    };
    this.listen = function (type, handler, scope) {
        this.on('_event_' + preventCollision(type), handler, scope);
    };
    var hash = function (str) {
        // Based on: http://phpjs.org/functions/crc32
        var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
        var crc = 0;
        var x = 0;
        var y = 0;
        crc = crc ^ (-1);
        for (var i = 0, iTop = str.length; i < iTop; i++) {
            y = (crc ^ str.charCodeAt(i)) & 0xFF;
            x = "0x" + table.substr(y * 9, 8);
            crc = (crc >>> 8) ^ x;
        }
        return Math.abs(crc ^ (-1));
    };

    var myPing = {
        pings: {}
    };
    this.ping = function () {
        if (this.getState() != this.STATE.PZH_ONLINE) return false;
        var id = hash('' + Math.random());
        var ev = connectorServices.events.service.createWebinosEvent();
        ev.type = internalEventType.ping;
        ev.payload = id;
        myPing.pings[id] = { resp: {}, timeSend: Date.now() };
        ev.dispatchWebinosEvent();
        return true;
    };
    var pong = function (id) {
        if (that.getState() != that.STATE.PZH_ONLINE) return false;
        var ev = connectorServices.events.service.createWebinosEvent();
        ev.type = internalEventType.pong;
        ev.payload = id;
        ev.dispatchWebinosEvent();
        return true;
    };
    var ponged = function (id, from) {
        if (myPing.pings[id] == undefined) return;
        var now = Date.now();
        var time = now - myPing.pings[id].timeSend;
        myPing.pings[id].resp[from] = {
            from: from,
            reply: now,
            time: time
        };
        checkDevice(from, time);
        triggerEvent("pinged", { device: from, time: time });
    };
    var checkDevice = function (name, ping) {
        var connectedRegex = /([A-Za-z0-9\-\_\.]+)\/([A-Za-z0-9\-\_\.]+)(?:\/)?(.+)?/;
        if (nameParts = name.match(connectedRegex)) {
            //            name = nameParts[1]+"/"+nameParts[2];
            var newone = (connectedDevices.pzp[name] == null);
            connectedDevices.pzp[name] = { ping: ping };
            if (newone) {
                triggerEvent("newDevice", name);
            }
        }
    };
    var hello = function (resp) {
        if (that.getState() != that.STATE.PZH_ONLINE) return false;
        var ev = connectorServices.events.service.createWebinosEvent();
        ev.type = internalEventType.hello;
        ev.payload = resp ? "hi" : "hello";
        ev.dispatchWebinosEvent();
        return true;
    };

    var internalEventType = {
        ping: preventCollision('_ping_'),
        pong: preventCollision('_pong_'),
        hello: preventCollision('_hello_')
    };

    var currentEventsApiZoneId = null;
    this.getEventsZone = function () {
        return currentEventsApiZoneId;
    }
    this.promptForEvents = function () {
        currentEventsApiZoneId = null;
        if (typeof localStorage != "undefined") {
            localStorage.removeItem("eventsApi_zoneId");
        }
        findEventsAPI();
    };
    var findEventsAPI = function () {
        if (currentEventsApiZoneId != null || (typeof localStorage != "undefined" && localStorage.getItem("eventsApi_zoneId") != null)) {
            if (typeof localStorage != "undefined") {
                currentEventsApiZoneId = localStorage.getItem("eventsApi_zoneId");
            }
            webinos.ServiceDiscovery.findServices(
                new ServiceType('http://webinos.org/api/events'),
                {
                    onFound: function (service) {
                        service.bind({
                            onBind: function (service) {
                                connectorServices.events.service = service;
                                if (connectorServices.events.listenerId != null) {
                                    service.removeWebinosEventListener(connectorServices.events.listenerId);
                                }
                                connectorServices.events.listenerId = connectorServices.events.service.addWebinosEventListener(eventReceived);
                                if (that.getState() != that.STATE.PZH_ONLINE) {
                                    setState(that.STATE.PZH_ONLINE);
                                    hello();
                                }
                                triggerEvent("eventsBound", service);
                            }
                        });
                    },
                    onError: function (error) {
                        setState(that.STATE.ERROR);
                        connectorServices.events = null;
                    }
                },
                {},
                {
                    zoneId: [currentEventsApiZoneId]
                }
             );
        } else { // Prompt dashboard to select events api
            webinos.dashboard.open({
                module: 'explorer',
                data: {
                    service: ['http://webinos.org/api/events'],
                    select: "devices"
                }
            }).onAction(function (data) {
                if (typeof localStorage != "undefined") {
                    localStorage.setItem("eventsApi_zoneId", data.result[0].id);
                }
                currentEventsApiZoneId = data.result[0].id;
                findEventsAPI();
            });

        }
    };

    setState(that.STATE.INIT);
    webinos.session.addListener('registeredBrowser', function (data) {
        //        setState(that.STATE.CONNECTED_PZP);
        connectedDevices.myPzp = data.from;
        if (!data.payload.message.enrolled) {
            connectorServices.events = null;
            setState(that.STATE.VIRGIN);
        } else if (data.payload.message.state.Pzh !== "connected") {
            connectorServices.events = null;
            setState(that.STATE.PZH_OFFLINE);
        } else {
            findEventsAPI();
        }
        triggerEvent("registeredBrowser", data);
        //        if (!firstTime) return;
        //        firstTime = false;
        //        findServiceDevices('events', 'http://webinos.org/api/events');
    });
};