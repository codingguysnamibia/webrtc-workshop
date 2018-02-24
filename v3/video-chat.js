var errorElement = document.querySelector('#error-msg');
var video = document.querySelector('#local-video');
var canvas = window.canvas = document.querySelector('canvas');
var filterSelect = document.querySelector('select#filter');
var mirror = document.querySelector('#mirror');
var hangUp = document.querySelector('#hang-up');
var startLocalVideoBtn = document.querySelector('#start-local-video');
var webrtc = {};

canvas.width = 480;
canvas.height = 360;

var button = document.querySelector('#snapshot');
button.onclick = function() {
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	canvas.getContext('2d').
	drawImage(video, 0, 0, canvas.width, canvas.height);
};

var constraints = {
	audio: true,
	video: true
};

function handleSuccess(stream) {
	var videoTracks = stream.getVideoTracks();
	webrtc.stream = stream;
	console.log(videoTracks);
	console.log('Got stream with constraints:', constraints);
	console.log('Using video device: ' + videoTracks[0].label);
	stream.oninactive = function() {
		console.log('Stream inactive');
	};
	video.srcObject = stream;
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

function startLocalVideo() {
	navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
}

navigator.mediaDevices.enumerateDevices().then(function(devices) {
	var audioInputDevices = [];
	var audioOutputDevices = [];
	var videoDevices = [];
	var otherDevices = [];

	var mics = document.getElementById('mics');
	var speakers = document.getElementById('speakers');
	var cams = document.getElementById('cams');
	
	devices.forEach(function(device, index){
		switch(device.kind) {
			case 'audioinput':
			audioInputDevices.push(device);
			mics.options[mics.options.length] = new Option(device.label);
			break;
			case 'audiooutput':
			audioOutputDevices.push(device);
			speakers.options[speakers.options.length] = new Option(device.label);
			break;
			case 'videoinput':
			videoDevices.push(device);
			cams.options[cams.options.length] = new Option(device.label);
			break;
			default:
			otherDevices.push(device);
		}
	}); 	
});

filterSelect.onchange = function() {
	video.className = filterSelect.value;
};

mirror.onclick = function() {
	video.classList.toggle('mirror');
}

startLocalVideoBtn.onclick = function(e) {
	startLocalVideo();
}

hangUp.onclick = function() {
	webrtc.stream.getTracks().forEach(track => track.stop());
	video.setAttribute('src', '');
}
