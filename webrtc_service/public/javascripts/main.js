//'use strict';

var host = window.location.hostname;
var protocol    = location.protocol;
var port        = location.port;
var serviceName =  '';
var feedbacks = 0;
var time = 0;
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;
var propabilitySpit =0;
var score = 0;
var LR = 0;
var MR = 0;
var Rt = 0;
var prop = 0;
var jsonResponse









if(port == 8080){
    serviceName = protocol+'//'+host+':'+80;}
else if(host !== 'localhost'){
    serviceName =  protocol+'//'+host;
}
else{
    serviceName = protocol+'//'+host+':'+port;
}





var pcConfig = {
    'iceServers': [
        {
            'url': 'stun:stun.l.google.com:19302'
        }//,
//  {
//    'url': 'stun:stun1.l.google.com:19302'
//  },
//  {
//    'url': 'stun:stun2.l.google.com:19302'
//  },
//  {
//    'url': 'stun:stun3.l.google.com:19302'
//  },
//  {
//    'url': 'stun:stun4.l.google.com:19302'
//  },
//  {
//    "url": "stun:stun.sipgate.net"
//  },
//  {
//    "url": "stun:217.10.68.152"
//  },
//  {
//    "url": "stun:stun.sipgate.net:10000"
//  }
    ]
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


//

var socket = io.connect();

if (room !== '') {
    socket.emit('join', room);
    console.log('Attempted to join room', room);
}

socket.on('full', function(room) {
    console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
    console.log('Another peer made a request to join room ' + room);
    console.log('This peer is the initiator of room ' + room + '!');
    isInitiator = true;
    isChannelReady = true;
});

socket.on('joined', function(room) {
    console.log('joined: ' + room);
    isChannelReady = true;
});

socket.on('log', function(array) {
    console.log.apply(console, array);
});

socket.on('deleted', function(room) {
    console.log('deleted ??')
    window.location.href = "/"
});



//-------------------------------------------

function send(tag) {
    console.log('Client sending message: ', tag);
    socket.emit('tag', {tag: tag});
}

socket.on('tag',function (tag) {

    document.getElementById("id").innerHTML =  'service :'+tag.service;
    document.getElementById("idp").innerHTML =  'Idp :'+tag.idp ;
    document.getElementById("algo").innerHTML = 'Algorithm :'+tag.algo ;

    if(isInitiator === false){
        document.getElementById('desc_score').innerHTML = 'The probability is calculated with a formula taking the feedback and several parameters';

        document.getElementById("feedback2").style.width = "35%";
        document.querySelector('#accept').addEventListener('click', function (ev) {
        document.getElementById("feedback2").style = 'hidden';
        document.getElementById('remoteVideo').style.visibility ="visible" ;
        sendMessage('display');


        });

    }else {


        document.getElementById('desc_score').innerHTML = 'The score is the result of a classification algorithm and, in our case, it is calculated from some parameters for a demonstration';
    }

    if(isInitiator === false){
        document.getElementById('scoreTitle').innerHTML = 'Probabilité Spit';

        document.getElementById('informationCaller').innerHTML = 'information Receiver';


    }
    else {

        if(protocol == 'https:'){
            score = 0.35}
        if (host === 'localhost') {
            score += 0.4
        }
        if(port !== 8080){
            score += 0.35
        }


    }

    document.getElementById("score").innerHTML = score;



    if(isInitiator === true){
    var item = {
        service   : serviceName,
        idp       : serviceName,
        algo      : 'algo',
        score     : score
    };


    var xhr = new XMLHttpRequest();
    var url = 'http://localhost:4041/room/authority';
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            //var json = JSON.parse(xhr.responseText);
            //console.log(json.email + ", " + json.password);
        }
    };
    var data = JSON.stringify(item);
    xhr.send(data);
    }

    if(isInitiator === false){


        var xhr = new XMLHttpRequest();
        var url = 'http://localhost:4041/room/call/probability';
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                jsonResponse = xhr.responseText;
                //alert(jsonResponse);
                var x = Math.round(jsonResponse*100)/100;
                document.getElementById("score").innerHTML = Math.round(jsonResponse*10000)/10000;
                document.getElementById("scores").innerHTML = 'Spit probability for this call :'+Math.round(jsonResponse*10000)/10000;
            }
        };

        xhr.send(null);
    }

});



//-------------------------------------------

function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', {message: message, room: room});
}

// This client receives a message
socket.on('message', function(message) {
    console.log('Client received message:', message);

   /* if (message.type === 'tag') {

        document.getElementById("display5").innerHTML = message.idp +'  '+message.service+' '+message.algo+'    '+message.score ;
        //alert("console"+message.service)
    }*/

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
                            document.getElementById('peerIdentity').innerHTML= res.name;
                            document.getElementById('peerIdentityProvider').innerHTML= res.idp;
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
                            document.getElementById('peerIdentity').innerHTML= res.name;
                            document.getElementById('peerIdentityProvider').innerHTML= res.idp;
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
    }else if (message === 'display') {
        document.getElementById('remoteVideo').style.visibility ="visible" ;
    }

});



/*
var xhr = new XMLHttpRequest();
var url = 'http://localhost:4041/room/zone/Black';
xhr.open("GET", url, true);
xhr.setRequestHeader("Content-type", "application/json");
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {

        //alert(xhr.responseText)
        var response = JSON.parse(xhr.responseText);

        if(response.Grey === false && response.Grey === false){
            document.getElementById("list").innerHTML = serviceName+' is classified in the White zone';
        }

        if(response.Grey === true){
            document.getElementById("list").innerHTML = serviceName+' is classified in the Grey zone';
        }

        if(response.Black === true){
            //document.getElementById("list").innerHTML = serviceName+' is classified in the Black zone';
            document.getElementById("feedback2").style.width = "35%";
            //setTimeout(function(){ document.getElementById("feedback2").style.width = "0%";}, 7000);

        }
    }
};
xhr.send(null);*/








var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');



document.querySelector('#start').addEventListener('click',function (e) {


// get hostname of service

navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
})
    .then(gotStream)
    .catch(function(e) {
        alert('getUserMedia() error: ' + e.name);
    });

// pop_up confirmation


function gotStream(stream) {
    localVideo.src = window.URL.createObjectURL(stream);
    localStream = stream;
    sendMessage('got user media');
    if (isInitiator) {
        maybeStart();
    }
}

    document.getElementById('start').remove();
    document.getElementById('conv').remove();


var constraints = {
    video: true
};
console.log('Getting user media with constraints', constraints);


});



function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            localACR = 1;
            doCall();
        }

        send({
            type: 'tag',
            service: serviceName,
            idp:serviceName,
            algo:'algox',
            score:score
        });


    }
}


window.onbeforeunload = function() {
    var init = {method: 'DELETE',
        credentials: 'same-origin'}
    fetch(window.location+'/user/me',init)
        .then(res => sendMessage('bye'))
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(pcConfig);
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

/*function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
}*/

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

//function requestTurn(turnURL) {
//  var turnExists = false;
//  for (var i in pcConfig.iceServers) {
//    if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
//      turnExists = true;
//      turnReady = true;
//      break;
//    }
//  }
//  if (!turnExists) {
//    console.log('Getting TURN server from ', turnURL);
//    // No TURN server. Get one from computeengineondemand.appspot.com:
//    var xhr = new XMLHttpRequest();
//    xhr.onreadystatechange = function() {
//      if (xhr.readyState === 4 && xhr.status === 200) {
//        var turnServer = JSON.parse(xhr.responseText);
//        console.log('Got TURN server: ', turnServer);
//        pcConfig.iceServers.push({
//          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
//          'credential': turnServer.password
//        });
//        turnReady = true;
//      }
//    };
//    xhr.open('GET', turnURL, true);
//    xhr.send();
//  }
//}

function handleRemoteStreamAdded(event) {
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
}


function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function hangup() {
    console.log('Hanging up.');

    sendMessage('bye');
    stop();


}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}


function stop() {
    var v2 = document.getElementById("remoteVideo");
    var x = v2.currentTime;
    time = x;
    //document.getElementById("display3").innerHTML = time;

    isStarted = false;
    // isAudioMuted = false;
    // isVideoMuted = false;
    localStream.stop();
    pc.close();
    pc = null;
    open_feedback();
    hideConversation();
    close_feedback();


}







//document.getElementById("display4").innerHTML = host;
//document.getElementById("display").innerHTML  = serviceName ;
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
    doCall();
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


/*********************************/


// feedbacks
function open_feedback() {
    document.getElementById("feedback").style.width = "100%";

}

// hide conversation
function hideConversation() {
    //document.getElementById("Container").style.width = "0%";
    document.getElementById('Container').remove();
    document.getElementById("foo").remove();
    document.getElementById("mySidenav").remove();
}


function close_feedback() {

    document.querySelector('#yes').addEventListener('click', function (e) {
        document.getElementById("feedback").style.width = "0%";

        feedbacks = 1;
        if(score < 0.5)
        LR++ ;
        if(time < 10)
        Rt++;
        // update request ajax

        // create a data for spit to insert in db
        var item = {
            tag         :{service:serviceName,idp:serviceName,algo:"algo",score:score},
            Feedback    : feedbacks,
            Date        : Date.now(),
            callTime    : time,
            lr          : LR,
            Mr          : MR,
            Rt          : Rt
        };
        // ajax request
        var xhr = new XMLHttpRequest();
        var url = 'http://localhost:4041/room/spit';
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                //var json = JSON.parse(xhr.responseText);
                //console.log(json.email + ", " + json.password);

                // juste modifier la requete sur la route avec un update
            }
        };
        var data = JSON.stringify(item);
        xhr.send(data);

    });

    document.querySelector('#no').addEventListener('click', function (e) {
        document.getElementById("feedback").style.width = "0%";
        feedbacks = -1;
        if(score > 0.5)
        MR++;
        if(time < 10)
        Rt++;
        // create a data for spit to insert in db
        var item = {
            tag         : {service:serviceName,idp:serviceName,algo:"algo",score:score},
            Feedback    : feedbacks,
            Date        : Date.now(),
            callTime    : time,
            lr          : LR,
            Mr          : MR,
            Rt          : Rt
        };
        // ajax request
        var xhr = new XMLHttpRequest();
        var url = 'http://localhost:4041/room/spit';
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                //var json = JSON.parse(xhr.responseText);
                //console.log(json.email + ", " + json.password);
            }
        };
        var data = JSON.stringify(item);
        xhr.send(data);


    });
}


// Retrieve



(function () {


    // Does the browser actually support the video element?
    var supportsVideo = !!document.createElement('video').canPlayType;

    if (supportsVideo) {
        // Obtain handles to main elements
        var videoContainer = document.getElementById('Container');
        var video = document.getElementById('localVideo');
        var videoControls = document.getElementById('video-controls');

        // Hide the default controls
        video.controls = false;

        // Display the user defined video controls
        videoControls.style.display = 'block';

        // Obtain handles to buttons and other elements

        var mute = document.getElementById('mute');
        var fullscreen = document.getElementById('fs');

        // Check if the browser supports the Fullscreen API
        var fullScreenEnabled = !!(document.fullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled || document.webkitSupportsFullscreen || document.webkitFullscreenEnabled || document.createElement('video').webkitRequestFullScreen);
        // If the browser doesn't support the Fulscreen API then hide the fullscreen button
        if (!fullScreenEnabled) {
            fullscreen.style.display = 'none';
        }



        // Set the video container's fullscreen state
        var setFullscreenData = function(state) {
            videoContainer.setAttribute('data-fullscreen', !!state);
        }

        // Checks if the document is currently in fullscreen mode
        var isFullScreen = function() {
            return !!(document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
        }

        // Fullscreen
        var handleFullscreen = function() {
            // If fullscreen mode is active...
            if (isFullScreen()) {
                // ...exit fullscreen mode
                // (Note: this can only be called on document)
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
                else if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
                else if (document.msExitFullscreen) document.msExitFullscreen();
                setFullscreenData(false);
            }
            else {
                // ...otherwise enter fullscreen mode
                // (Note: can be called on document, but here the specific element is used as it will also ensure that the element's children, e.g. the custom controls, go fullscreen also)
                if (videoContainer.requestFullscreen) videoContainer.requestFullscreen();
                else if (videoContainer.mozRequestFullScreen) videoContainer.mozRequestFullScreen();
                else if (videoContainer.webkitRequestFullScreen) {
                    // Safari 5.1 only allows proper fullscreen on the video element. This also works fine on other WebKit browsers as the following CSS (set in styles.css) hides the default controls that appear again, and
                    // ensures that our custom controls are visible:
                    // figure[data-fullscreen=true] video::-webkit-media-controls { display:none !important; }
                    // figure[data-fullscreen=true] .controls { z-index:2147483647; }
                    video.webkitRequestFullScreen();
                }
                else if (videoContainer.msRequestFullscreen) videoContainer.msRequestFullscreen();
                setFullscreenData(true);
            }
        }

        // Only add the events if addEventListener is supported (IE8 and less don't support it, but that will use Flash anyway)
        if (document.addEventListener) {
            // Wait for the video's meta data to be loaded, then set the progress bar's max value to the duration of the video
            video.addEventListener('loadedmetadata', function() {
                //progress.setAttribute('max', video.duration);
            });

            // Add events for all buttons


            mute.addEventListener('click', function(e) {
                video.muted = !video.muted;
            });


            fs.addEventListener('click', function(e) {
                handleFullscreen();
            });



            // Listen for fullscreen change events (from other controls, e.g. right clicking on the video itself)
            document.addEventListener('fullscreenchange', function(e) {
                setFullscreenData(!!(document.fullScreen || document.fullscreenElement));
            });
            document.addEventListener('webkitfullscreenchange', function() {
                setFullscreenData(!!document.webkitIsFullScreen);
            });
            document.addEventListener('mozfullscreenchange', function() {
                setFullscreenData(!!document.mozFullScreen);
            });
            document.addEventListener('msfullscreenchange', function() {
                setFullscreenData(!!document.msFullscreenElement);
            });
        }
    }

})();


//controles

function openNav() {
    document.getElementById("mySidenav").style.visibility="visible";
}

function closeNav() {
    document.getElementById("mySidenav").style.visibility="hidden";
}





