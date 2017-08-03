var User = require('../app/models/user');
var asserid = require('../app/models/idAssertion');
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');
var spit = require('../app/models/spit.js');
var zone = require('../app/models/zone.js');
var auth = require('../app/models/authority.js');
var prop =0;
mongoose.Promise = global.Promise;

module.exports = function (app, passport) {
    // local ipdProxy routes ===============================================================
    app.use(bodyParser.json());
    app.get('/assertion', function (req, res) {
        asserid.getAssertion(function (err, asser) {
            if (err) {
                throw err;
            }
            res.json(asser);
        })
    });
    app.get('/assertion/:id', function (req, res) {
        asserid.findOne({
            $or: [
                {
                    '_id': req.params.id
                }
            ]
        }, function (err, asserid) {
            if (err)
                res.status(500).send(err);
            else if (asserid) {
                console.log(asserid)
                var confirm = {
                    identity: asserid.user.split('@') [0] + '@localhost:4041',
                    contents: asserid.content
                }
                res.json(confirm);
            }
            else
                res.sendStatus(404)
        })
    });
    app.post('/assertion', isLoggedIn, function (req, res) {
        var gn = req.body;
        console.log(req.session);
        if (typeof (req.user) !== 'undefined') {
            gn.user = req.user.local.email
            asserid.addAssertion(gn, function (err, gn) {
                if (err) {
                    throw err;
                }
                res.json(gn);
            })
        }
        else {
            console.log('login is required or false')
        }
    });
    app.use(express.static('public')); //get proxy


// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('pages/index.ejs', {
            user : req.user,
            rooms: app.get('rooms'),
            message: req.flash('roomMessage')
        });
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('pages/profile.ejs', {
            user : req.user
        });
    });


    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/error', function(req,res){
        console.log(req)
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('pages/login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('pages/signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('pages/connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // connect jwt -----------------------------

        app.get('/auth/connect', passport.authenticate('jwt', {
            successRedirect : '/',
            failureRedirect : '/',
            failureFlash : true // allow flash messages
        }))

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


// =============================================================================
// DOMAIN REGISTRY =============================================================
// =============================================================================


    app.get('/registry/:userId', function(req,res){
        var userId = req.params.userId
        User.findOne({$or:[
                         {'_id':userId},
                         {'local.email':userId}
                       ]}
        , function(err, user){
            if (err)
                res.status(500).send(err);
            else if (user)
                res.send(getAvailability(user._id));
            else
                res.sendStatus(404)
        })
    });

    app.get('/registry/:domainId/:userDomainId', function(req,res){
        var userId = req.params.userDomainId,
            domainId = req.params.domainId
        User.findOne({'jwt.sub':userId, 'jwt.iss':domainId}, function(err, user){
            if (err)
                res.status(500).send(err)
            else if (user){
                res.send(getAvailability(user._id))
            }
            else
                res.sendStatus(404)
        })
    });

    function getAvailability(userId){
        var userInRoom = {},
            rooms = app.get('rooms')

        for (room in rooms){
            for(user in rooms[room].user){
                if (JSON.stringify(rooms[room].user[user]._id) === JSON.stringify(userId)) {
                    userInRoom[rooms[room].name] = {type:'url', url:'/room/'+rooms[room].name}
                }
            }
        }
        return userInRoom
    }


    var rooms1 = {user:'',name:'',descr:'',socket:[]}

        // process the login form
    app.post('/room/create', isLoggedIn, function(req, res) {

        var rooms = app.get('rooms'),
            roomId = req.body.room,
            descr = req.body.descr;
        console.log('display information post room')
        console.log('POST ROOM ID = '+roomId+'description = '+ descr);
        // create object instance for room


        if (roomId !== (null && undefined)){
        rooms1 = {
            user  : [],
            name  : roomId,
            descr : req.body.descr,
            socket:[]
        }

        console.log('the name of room is '+rooms1.name+'the description'+' '+rooms1.descr)
        rooms = rooms1;

        /*if(!rooms[roomId]){
            console.log('Create '+roomId)
            rooms[roomId] = {
                user:[],
                name: roomId,
                descr:descr,
                socket:[]
            }*/
            res.redirect('/room/'+roomId)
        } else {
            req.flash('roomMessage', 'Room '+roomId+' already exists.');
            res.redirect('/');
        }
    });






    // ROOM ==============================
    app.get('/room/:roomId', isLoggedIn, function(req, res){
        var rooms = app.get('rooms'),
            roomId = req.params.roomId,
            user = req.user,
            descr = rooms1.descr;

        console.log(rooms1);

        if(! rooms[roomId]){
            console.log('Get '+roomId)
            rooms[roomId] = {
                user:[],
                name: roomId,
                descr:descr,
                socket:[]
            }

            console.log('the last'+rooms[roomId])
        }
        if(rooms[roomId].user.length<2){
            rooms[roomId].user.push(user)
            console.log('Added user to room')
            console.log(rooms[roomId].user.length)
            res.render('pages/room.ejs', {
                user: req.user,
                room: req.params.roomId
            });
        } else {
            req.flash('roomMessage', 'Room '+roomId+' is full.');
            res.redirect('/');
        }
    });



    app.post('/room/spit', isLoggedIn, function(req, res){

        var request = req.body;
        console.log(request);
        //var request2 = JSON.parse(request)
        //console.log(request2);
        spit.addspit(request);
        console.log('zoning');
        //spit.getspitcall();
        // calculate probability

    });

    app.post('/room/authority', isLoggedIn, function(req, res){

        var request = req.body;
        console.log(request);
        //var request2 = JSON.parse(request)
        //console.log(request2);
        auth.addauthority(request);
        // get the service

        /*var authority_param = auth.getservice2();
         console.log(item.service);
         console.log(item.score)*/

        auth.get_score_service();


        //

    });


    app.get('/room/call/probability', function(req,res){

        var promise = auth.find({},{_id:0, score:1}).limit(1).sort({$natural:-1}).exec();

        promise.then(function(array) {
            // array of people ... do what you want here...
            console.log(array[0]);
            //res.send(JSON.stringify(arrayOfPeople[0]));
            return res.end(JSON.stringify(array[0].score))

        });

    });

    app.post('/room/zone', isLoggedIn, function(req, res){
        var request = req.body;
        console.log(request);
        zone.addzone(request);
    });


    app.get('/room/zone/Black', function(req,res){

        var obj  = {};
        var promise  = zone.find({'zone.Black': true}).distinct('service').exec();
        promise.then(function(doc) {
            if (doc[0]!== undefined){
            obj ={service: doc[0] , Grey:false, Black:true};
            return res.end(JSON.stringify(obj));
            }
        });

        var promise2 = zone.find({'zone.Grey': true}).distinct('service').exec()
        promise2.then(function(doc) {
            if (doc[0]!== undefined){
                obj ={service: doc[0] , Grey:true, Black:false};
                return res.end(JSON.stringify(obj));
            }
        })


        var promise3 = zone.find({}).distinct('service').exec()
        promise3.then(function(doc) {
            if (doc[0]=== undefined){
                obj ={ Grey:false, Black:false};
                return res.end(JSON.stringify(obj));
            }

        });

    });



   /* app.delete('/room/:roomId', isLoggedIn, function(req,res){
        var rooms = app.get('rooms');
            room = rooms[req.params.roomId],
            //index = rooms.indexOf([req.params.roomId])
        //rooms.splice(room)
        console.log('i try to remove item from room! list***')
        //console.log('room'+rooms[room].name)
        console.log('stringfy*******************')
        console.log(rooms)


        //delete rooms.na

        console.log('removed from list****')

        res.sendStatus(200)
        for (var i = 0; i<room.socket.length; i++) {
            room.socket[i].emit('deleted', req.params.roomId)
        }
    });*/



    app.delete('/room/:roomId', isLoggedIn, function(req,res){
        var rooms = app.get('rooms')
        var Id = req.params.roomId;
        delete rooms[Id];
        //console.log('DELETE ROOM BY ID RESULT'+JSON.stringify(rooms));
        res.sendStatus(200);
        for (var id in rooms.socket){
            rooms.socket[id].emit('deleted', req.params.roomId)

        }
    });





    app.delete('/room/:roomId/user/me', isLoggedIn, function(req,res){
        res.sendStatus(200)
        var room = app.get('rooms')[req.params.roomId]
        if(room){
            for (var i = 0; i<room.user.length; i++) {
                    if (JSON.stringify(room.user[i]._id) === JSON.stringify(req.user._id)) {
                        room.user.splice(i,1)
                        //We remove only the first
                        break;
                    }
            }
        }
    })
};





// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

