'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  'mandatory': {
    'OfferToReceiveAudio': true,
    'OfferToReceiveVideo': true
  }
};

/////////////////////////////////////////////

//var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', {message: message, room: room});
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
    setIdentityACOR();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    var sessionDescription = new RTCSessionDescription(message)
    parseACOR(sessionDescription.sdp)
    setIdentityACOR()
    //console.log('Set Remote')
    console.log(sessionDescription)
    pc.setRemoteDescription(sessionDescription)
    .then(() => {
        console.log('Remote set')
        if(pc.peerIdentity){
            pc.peerIdentity
            .catch(error => {
                console.error(error)
            })
            .then(res => {
                document.getElementById('peerId').innerHTML= 'Peer identity is '+res.name+' verified by '+res.idp+'.';
            })
        }
        doAnswer();
    })
    .catch(error => {
        console.error(error)
    })
  } else if (message.type === 'answer' && isStarted) {
    var sessionDescription = new RTCSessionDescription(message)
    parseACOR(sessionDescription.sdp)
    pc.setRemoteDescription(sessionDescription)
    .then(setDescrRes => {
        console.log('Remote set')
        console.log(setDescrRes)
        if(pc.peerIdentity){
            pc.peerIdentity
            .catch(error => {
                console.error(error)
            })
            .then(res => {
                document.getElementById('peerId').innerHTML= 'Peer identity is '+res.name+' verified by '+res.idp+'.';
            })
        }
    })
    .catch(error => {
        console.error(error)
    })
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

var constraints = {
  video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      localACR = 1
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer().then(
    setLocalAndSendMessage,
    handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  console.log('setLocalAndSendMessage')
  sessionDescription.sdp = reqIdentityACOR(sessionDescription.sdp, distantACR, distantOR)
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  console.log(pc.localDescription)
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  console.error('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  pc.close();
  pc = null;
}

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('m=audio') !== -1) {
      mLineIndex = i;
      break;
    }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
          opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length - 1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}


/********************************************************
/************** SDP NEGOTIATION *************************
/*******************************************************/

var distantOR = null,
    distantACR = -1,
    localOR = null,
    localACR = -1,
    requestedACOR = {or:null, acr:-1}

function raiseDistantACR(){
    distantACR = document.getElementById('peer_acr').value;
    distantOR = document.getElementById('peer_or').value;
    doCall()
    return false
}

function splitMediaSdp(sdp){
    var sdpArray = sdp.split(/(a=identity|m=)/)
    return sdpArray
}

function parseACOR(sdp){
    var acor = {acr:-1, or:null}
    if(sdp.indexOf('a=acor:') !== -1){
        var array = sdp.split(/a=acor:|m=.*/)[1].split(/\s/)
        acor.acr = JSON.parse(array[1])
        acor.or = array[0]
    }
    requestedACOR = acor
}

/** REQUEST Identity ACOR to Remote peer **/
function reqIdentityACOR(sdp, acr, or){
    var sdpArray = splitMediaSdp(sdp)
    var acor = 'a=acor:'+or+' '+acr+'\n'
    sdpArray.splice(1,0, acor)
    return sdpArray.join('')
}

/** SET Local Identity ACOR **/
function setIdentityACOR(){
    // Add Identity
    console.log('Setting OR and ACR as requested')
    console.log(requestedACOR)
    if(requestedACOR.acr <= 0){
        // do nothing, no auth required
    }
    else if(requestedACOR.or == 'null' || requestedACOR.or == 'energyq.idp.rethink.orange-labs.fr'){
        //We use the default one (ie 192.168.99.100)
        localOR = requestedACOR.or
        localACR = localACR>requestedACOR.acr? localACR : requestedACOR.acr
        if(localACR>=0){
            console.log('setIdp with acr '+localACR)
            pc.setIdentityProvider('energyq.idp.rethink.orange-labs.fr','rethink-oidc','acr='+localACR)
        } else {
            console.log('acr < 0, no identity requested')
        }
    } else {
        //We can't use the requested IdP
        window.alert('Cannot comply with OR '+requestedACOR.or)
    }
}