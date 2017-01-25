# ACOR SDP Negotiation
*ICWE Demonstration*

This simple WebRTC service demonstrates how to negotiate over identity parameters for a WebRTC session.
- ACR: Authentication Context Class reference Request
- OR: Origin Request

Users first authenticate to the WebRTC service, then connect to a room. For instance /room/42. When there is two
users in a room a WebRTC conversation starts. However, although both users are logged into the website, they are 
anonymous to each others.

One user can then request the other user to authenticate. To do so it must
- set ACR >= 0
- set origin to a valid origin for a compatible IdP (see below)

The requesting user will then receive an identity assertion from the other peer and verify it through the linked IdP Proxy. 
The web application will then display the verified identity assertion (though in real life scenario, it should be
the browser).


**Installation**: 
‘sudo mongod
npm install
node index.js‘

**Negotiation**: Main negotiation code is in webrtc_service/public/javascripts/main.js

### Prerequisites
The main requirement is for user to use a compatible IdP to login. It is not necessary for the user to be logged 
into the website with this IdP, the username+password method could be used. But the user must have an active session
with the IdP.

**IdPs**: Compatibles IdPs are available at 
- https://github.com/reTHINK-project/dev-IdPServer
- https://energyq.idp.rethink.orange-labs.fr (/profile/create to create a new user)

The connect login option uses a Firefox extension to let the user select his own Identity Provider rather than being
locked by implementation choices made by the website. 

**Connect login**: Use OIDC adapter extension for login on Firefox. 
- https://github.com/Sparika/WebConnect
- https://addons.mozilla.org/fr/firefox/addon/web-identity-management/

**Database**: Requires Mongo




### SDP Offer diagram
![sdp_offer](https://cloud.githubusercontent.com/assets/1267701/22293624/a0743c14-e310-11e6-8558-96de80e6b075.png)



### SDP Answer diagram
![sdp_answer](https://cloud.githubusercontent.com/assets/1267701/22293622/9f0c2f08-e310-11e6-984d-f898eb34cf73.png)