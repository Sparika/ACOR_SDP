// server.js

//'use strict';

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var os = require('os');
//var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var configDB = require('./config/database.js');

console.log('Init ...')

//TODO Unsecure but IdP is auto-signed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

app.use(express.static('public'))
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// required for passport
app.use(session({
    secret: 'ilovescotchscotchyscotchscotch', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

var rooms = []
app.set('rooms', rooms);
// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
var server = http.createServer(app);
var io = require('socket.io').listen(server);  //pass a http.Server instance
server.listen(port);
console.log('The magic happens on port ' + port);

io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    //io.to(message.room).emit('event', message.message);
    //socket.broadcast.emit('message', message.message);
      socket.broadcast.in(message.room).emit('message', message.message);
  });

  socket.on('join', function(room) {
    log('Received request to join room ' + room);
    socket.join(room);
    rooms[room].socket.push(socket)
    socket.emit('joined', room)
    socket.broadcast.to(room).emit('join', room);
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('disconnect', function(){
    console.log('received bye');
  });

});


//
//
//var fileServer = new(nodeStatic.Server)();
//var app = http.createServer(function(req, res) {
//  fileServer.serve(req, res);
//}).listen(8080);


