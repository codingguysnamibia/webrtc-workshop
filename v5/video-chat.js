var errorElement = document.querySelector('#error-msg');
var video = document.querySelector('#local-video');
var remoteVideo = document.querySelector('#remote-video');
var canvas = window.canvas = document.querySelector('canvas');
var filterSelect = document.querySelector('select#filter');
var mirror = document.querySelector('#mirror');
var hangUp = document.querySelector('#hang-up');
var startLocalVideoBtn = document.querySelector('#start-local-video');
var constraints = {};
var webrtc = {};
var audioInputDevices = [];
var audioOutputDevices = [];
var videoDevices = [];
var otherDevices = [];
var mics = document.getElementById('mics');
var speakers = document.getElementById('speakers');
var cams = document.getElementById('cams');
var localStream;
var peer1;
var peer1Ice = [];
var peer2;
var peer2Ice = [];
var localOfferField = document.querySelector('#local-offer');
var remoteOfferField = document.querySelector('#remote-offer');
var setRemoteOfferBtn = document.querySelector('#set-remote-offer');
var localAnswerField = document.querySelector('#local-answer');
var remoteAnswerField = document.querySelector('#remote-answer');
var remoteAnswerBtn = document.querySelector('#set-remote-answer');
var setIceCandidates1 = document.querySelector('#set-ice-candidates-1');
var iceCandidatesFieldMine = document.querySelector('#ice-candidates-mine');
var iceCandidatesFieldMine2 = document.querySelector('#ice-candidates-mine-2');
var iceCandidatesField1 = document.querySelector('#ice-candidates-1');
var setIceCandidates2 = document.querySelector('#set-ice-candidates-2');
var iceCandidatesField2 = document.querySelector('#ice-candidates-2');

var attach = document.querySelector('#attach');
var offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
};
var joinCallBtn = document.querySelector('#join-call');
var snapshotBtn = document.querySelector('#snapshot');

function handleSuccess(stream, caller) {
    var videoTracks = stream.getVideoTracks();
    var audioTracks = stream.getAudioTracks();
    var peerConnectionOptions = null;

    webrtc.stream = stream;
    video.srcObject = stream;
    localStream = stream;

    stream.oninactive = function () {
        console.log('Stream inactive');
    };

    var ipTurn = 'turn:188.166.149.10:3478';
    var ipIce = 'stun:23.21.150.121';
    var ipStun = 'stun:stun.l.google.com:19302';


    var peerConnectionConfig = {
        'iceServers': [{'urls': ipStun},
            {
                'urls': ipTurn,
                'username': 'testu',
                'credential': 'sturentsp'
            }
        ]
    };

    if (caller == true) {
        peer1 = new RTCPeerConnection(peerConnectionConfig, {});
        peer1.onicecandidate = function (e) {
            onIceCandidate(e, caller);
        };
        videoTracks.forEach(function (track) {
            console.log(track)
            console.log(localStream)
            peer1.addTrack(track, localStream);
        });

        peer1.ontrack = gotRemoteStream;

        peer1.createOffer(offerOptions)
            .then(onCreateOfferSuccess, onCreateSessionDescriptionError);

    }
    else {
        peer2 = new RTCPeerConnection(peerConnectionConfig, {})
        peer2.onicecandidate = function (e) {
            onIceCandidate(e, false)
        };

        videoTracks.forEach(function (track) {
            peer2.addTrack(track, localStream);
        });

        peer2.ontrack = gotRemoteStream;

    }
}

function onCreateOfferSuccess(desc) {
    //console.log('Offer from peer1\n' + desc.sdp);
    console.log('peer1 setLocalDescription start');
    peer1.setLocalDescription(desc).then(function () {
        onSetLocalSuccess(peer1)
    }, onSetSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}

function onIceCandidate(e, caller) {
    if (e.candidate == null) {
        if (caller == true) {
            iceCandidatesFieldMine.value = JSON.stringify(peer1Ice);
        }
        else {
            iceCandidatesFieldMine2.value = JSON.stringify(peer2Ice);
        }
        return;
    }

    if (caller == true) {
        localOfferField.value = JSON.stringify(peer1.localDescription);
        peer1Ice.push(e.candidate);
    }
    else {
        localAnswerField.value = JSON.stringify(peer2.localDescription);
        peer2Ice.push(e.candidate);
    }
}

function onSetLocalSuccess(pc) {
    console.log(pc + ' setLocalDescription complete');
}

function onSetSessionDescriptionError(error) {
    console.log('Failed to set session description: ' + error.toString());
}

function handleError(error) {
    if (error.name === 'ConstraintNotSatisfiedError') {
        console.log('The resolution ' + constraints.video.width.exact + 'x' +
            constraints.video.width.exact + ' px is not supported by your device.');
    } else if (error.name === 'PermissionDeniedError') {
        console.log('Permissions have not been granted to use your camera and ' +
            'microphone, you need to allow the page access to your devices in ' +
            'order for the demo to work.');
    }
    console.log('getUserMedia error: ' + error.name, error);
}

function startLocalVideo(caller) {
    startLocalVideoBtn.disabled = true;
    joinCallBtn.disabled = true;
    video.classList.toggle('mirror');

    var audioSource = speakers.value;
    var videoSource = cams.value;

    constraints = {
        audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
        video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };

    console.log(constraints);

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        handleSuccess(stream, caller);
    }).catch(handleError);
}

navigator.mediaDevices.enumerateDevices().then(function (devices) {

    devices.forEach(function (device, index) {
        switch (device.kind) {
            case 'audioinput':
                audioInputDevices.push(device);
                mics.options[mics.options.length] = new Option(device.label, device.deviceId);
                break;
            case 'audiooutput':
                audioOutputDevices.push(device);
                speakers.options[speakers.options.length] = new Option(device.label, device.deviceId);
                break;
            case 'videoinput':
                videoDevices.push(device);
                cams.options[cams.options.length] = new Option(device.label, device.deviceId);
                break;
            default:
                otherDevices.push(device);
        }
    });
});

snapshotBtn.onclick = function () {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
};

filterSelect.onchange = function () {
    video.className = filterSelect.value;
};

mirror.onclick = function () {
    video.classList.toggle('mirror');
};

startLocalVideoBtn.onclick = function (e) {
    startLocalVideo(true);
};

joinCallBtn.onclick = function () {
    startLocalVideo();
};

setRemoteOfferBtn.onclick = function () {
    var offer = JSON.parse(remoteOfferField.value);
    peer2.setRemoteDescription(offer).then(function () {
        onSetRemoteSuccess(peer2);

        peer2.createAnswer()
            .then(onCreateAnswerSuccess, onCreateSessionDescriptionError);
    }, onSetSessionDescriptionError);
};

function onCreateAnswerSuccess(desc) {
    //console.log('Answer from peer2:\n' + desc.sdp);
    console.log('peer2 setLocalDescription start');
    peer2.setLocalDescription(desc).then(function () {
        onSetLocalSuccess(peer2);
    }, onSetSessionDescriptionError);
    peer2.ontrack = gotRemoteStream;
}

function gotRemoteStream(e) {
    webrtc.remoteStream = e.streams[0];
    console.log('peer2 received remote stream');
}

function onSetRemoteSuccess(pc) {
    console.log(pc + ' setRemoteDescription complete');
}

attach.onclick = function() {
    console.log('Attaching remote stream');
    remoteVideo.srcObject = webrtc.remoteStream;
};

remoteAnswerBtn.onclick = function () {
    var answer = JSON.parse(remoteAnswerField.value);
    peer1.setRemoteDescription(answer).then(function () {
        onSetRemoteSuccess(peer1);
    }, onSetSessionDescriptionError);
}

hangUp.onclick = function () {
    webrtc.stream.getTracks().forEach(function (track) {
        track.stop();
    });
    video.setAttribute('src', '');
    startLocalVideoBtn.disabled = false;
}

setIceCandidates1.onclick = function() {
    var iceCandidates = JSON.parse(iceCandidatesField1.value);
    iceCandidates.forEach(function(candidate){
        peer1.addIceCandidate(candidate, function(){
            console.log('Successfully added candidate!');
        }, function(error){
            console.error('Error adding candidate!', error);
        });
    });
}

setIceCandidates2.onclick = function() {
    var iceCandidates = JSON.parse(iceCandidatesField2.value);
    iceCandidates.forEach(function(candidate){
        peer2.addIceCandidate(candidate, function(){
            console.log('Successfully added candidate!');
        }, function(error){
            console.error('Error adding candidate!', error);
        });
    });
}