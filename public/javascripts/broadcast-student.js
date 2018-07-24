// Edit from Open-Sourced: https://github.com/muaz-khan/RTCMultiConnection

// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------


// recording is disabled because it is resulting for browser-crash
// if you enable below line, please also uncomment above "RecordRTC.js"
var enableRecordings = false;

var connection = new RTCMultiConnection(null, {
    useDefaultDevices: true // if we don't need to force selection of specific devices
});

// its mandatory in v3
connection.enableScalableBroadcast = true;

// each relaying-user should serve only 1 users
connection.maxRelayLimitPerUser = 1;

// we don't need to keep room-opened
// scalable-broadcast.js will handle stuff itself.
connection.autoCloseEntireSession = true;

// by default, socket.io server is assumed to be deployed on your own URL
connection.socketURL = '/';

// comment-out below line if you do not have your own socket.io server
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.socketMessageEvent = 'note-taking-system';

// user need to connect server, so that others can reach him.
connection.connectSocket(function (socket) {
    /*socket.on('logs', function(log) {
        //console.log(log);
    });
    */
    // this event is emitted when a broadcast is already created.
    socket.on('join-broadcaster', function (hintsToJoinBroadcast) {
        console.log('join-broadcaster', hintsToJoinBroadcast);

        connection.session = hintsToJoinBroadcast.typeOfStreams;
        connection.sdpConstraints.mandatory = {
            OfferToReceiveVideo: true,
            OfferToReceiveAudio: false
        };
        connection.join(hintsToJoinBroadcast.userid);
    });

    socket.on('rejoin-broadcast', function (broadcastId) {
        console.log('rejoin-broadcast', broadcastId);

        connection.attachStreams = [];
        socket.emit('check-broadcast-presence', broadcastId, function (isBroadcastExists) {
            if (!isBroadcastExists) {
                // the first person (i.e. real-broadcaster) MUST set his user-id
                connection.userid = broadcastId;
            }

            socket.emit('join-broadcast', {
                broadcastId: broadcastId,
                userid: connection.userid,
                typeOfStreams: connection.session
            });
        });
    });

    socket.on('broadcast-stopped', function (broadcastId) {
        bootbox.alert('廣播已結束!');
        if (document.getElementById('liveSwitchBtn')) {
            document.getElementById('liveSwitchBtn').remove();
        }
        document.getElementById('joinBroadcast').style.pointerEvents = "";
        showPPT();
        //location.reload();
        console.error('broadcast-stopped', broadcastId);
    });
    /*
                            // this event is emitted when a broadcast is absent.
                            socket.on('start-broadcasting', function(typeOfStreams) {
                                console.log('start-broadcasting', typeOfStreams);
    
                                // host i.e. sender should always use this!
                                connection.sdpConstraints.mandatory = {
                                    OfferToReceiveVideo: false,
                                    OfferToReceiveAudio: false
                                };
                                connection.session = typeOfStreams;
    
                                // "open" method here will capture media-stream
                                // we can skip this function always; it is totally optional here.
                                // we can use "connection.getUserMediaHandler" instead
                                connection.open(connection.userid, function() {
                                    showRoomURL(connection.sessionid);
                                });
                            });*/
});

var videoPreview = document.getElementById('video-preview');

connection.onstream = function (event) {
    if (connection.isInitiator && event.type !== 'local') {
        return;
    }

    if (event.mediaElement) {
        event.mediaElement.pause();
        delete event.mediaElement;
    }

    connection.isUpperUserLeft = false;
    videoPreview.src = URL.createObjectURL(event.stream);
    videoPreview.play();

    videoPreview.userid = event.userid;

    if (event.type === 'local') {
        videoPreview.muted = true;
    }

    if (connection.isInitiator == false && event.type === 'remote') {
        // he is merely relaying the media
        connection.dontCaptureUserMedia = true;
        connection.attachStreams = [event.stream];
        connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false
        };

        var socket = connection.getSocket();
        socket.emit('can-relay-broadcast');

        if (connection.DetectRTC.browser.name === 'Chrome') {
            connection.getAllParticipants().forEach(function (p) {
                if (p + '' != event.userid + '') {
                    var peer = connection.peers[p].peer;
                    peer.getLocalStreams().forEach(function (localStream) {
                        peer.removeStream(localStream);
                    });
                    peer.addStream(event.stream);
                    connection.dontAttachStream = true;
                    connection.renegotiate(p);
                    connection.dontAttachStream = false;
                }
            });
        }

        if (connection.DetectRTC.browser.name === 'Firefox') {
            // Firefox is NOT supporting removeStream method
            // that's why using alternative hack.
            // NOTE: Firefox seems unable to replace-tracks of the remote-media-stream
            // need to ask all deeper nodes to rejoin
            connection.getAllParticipants().forEach(function (p) {
                if (p + '' != event.userid + '') {
                    connection.replaceTrack(event.stream, p);
                }
            });
        }

        // Firefox seems UN_ABLE to record remote MediaStream
        // WebAudio solution merely records audio
        // so recording is skipped for Firefox.
        if (connection.DetectRTC.browser.name === 'Chrome') {
            repeatedlyRecordStream(event.stream);
        }
    }
};

function receiveBroadcast(broadcastId) {
    showVideo();
    document.getElementById('joinBroadcast').style.pointerEvents = "none";
    document.getElementById('joinBroadcast').value = broadcastId;
    var socket = connection.getSocket();
    connection.session = {
        screen: true,
        oneway: true
    };
    socket.emit('join-broadcast', {
        broadcastId: broadcastId,
        userid: connection.userid,
        typeOfStreams: connection.session
    });

    if (document.getElementById('liveSwitchBtn')) { // 避免出現很多個button
        document.getElementById('liveSwitchBtn').remove();
    }
    var livebtn = document.createElement("button");
    livebtn.setAttribute('onclick', "liveSwitchBtn()");
    livebtn.setAttribute('id', "liveSwitchBtn");
    livebtn.setAttribute('class', "btn btn-danger navbar-btn");
    livebtn.innerHTML = "顯示離線的投影片";
    var liElement = document.createElement("li");
    liElement.appendChild(livebtn);
    $('#navList').append(liElement);

}

connection.onstreamended = function () { };

connection.onleave = function (event) {
    if (event.userid !== videoPreview.userid) return;

    var socket = connection.getSocket();
    socket.emit('can-not-relay-broadcast');

    connection.isUpperUserLeft = true;

    if (allRecordedBlobs.length) {
        // playing lats recorded blob
        var lastBlob = allRecordedBlobs[allRecordedBlobs.length - 1];
        videoPreview.src = URL.createObjectURL(lastBlob);
        videoPreview.play();
        allRecordedBlobs = [];
    }
    else if (connection.currentRecorder) {
        var recorder = connection.currentRecorder;
        connection.currentRecorder = null;
        recorder.stopRecording(function () {
            if (!connection.isUpperUserLeft) return;

            videoPreview.src = URL.createObjectURL(recorder.blob);
            videoPreview.play();
        });
    }

    if (connection.currentRecorder) {
        connection.currentRecorder.stopRecording();
        connection.currentRecorder = null;
    }
};

var allRecordedBlobs = [];

function repeatedlyRecordStream(stream) {
    if (!enableRecordings) {
        return;
    }

    connection.currentRecorder = RecordRTC(stream, {
        type: 'video'
    });

    connection.currentRecorder.startRecording();

    setTimeout(function () {
        if (connection.isUpperUserLeft || !connection.currentRecorder) {
            return;
        }

        connection.currentRecorder.stopRecording(function () {
            allRecordedBlobs.push(connection.currentRecorder.blob);

            if (connection.isUpperUserLeft) {
                return;
            }

            connection.currentRecorder = null;
            repeatedlyRecordStream(stream);
        });
    }, 30 * 1000); // 30-seconds
};

// Using getScreenId.js to capture screen from any domain
// You do NOT need to deploy Chrome Extension YOUR-Self!!
connection.getScreenConstraints = function (callback) {
    getScreenConstraints(function (error, screen_constraints) {
        if (!error) {
            screen_constraints = connection.modifyScreenConstraints(screen_constraints);
            callback(error, screen_constraints);
            return;
        }
        throw error;
    });
};

