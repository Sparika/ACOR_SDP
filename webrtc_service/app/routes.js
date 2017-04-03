var User = require('../app/models/user');
var asserid = require('../app/models/idAssertion');
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');


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
            successRedirect : '/profile', // redirect to the secure profile section
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

        // process the login form
    app.post('/room/create', isLoggedIn, function(req, res) {
        var rooms = app.get('rooms'),
            roomId = req.body.room,
            descr = req.body.descr
        if(! rooms[roomId]){
            console.log('Create '+roomId)
            rooms[roomId] = {
                user:[],
                name: roomId,
                socket:[],
                descr:descr
            }
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
            user = req.user
        if(! rooms[roomId]){
            console.log('Get '+roomId)
            rooms[roomId] = {
                user:[],
                name: roomId,
                socket:[]
            }
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

    app.delete('/room/:roomId', isLoggedIn, function(req,res){
        var rooms = app.get('rooms')
            room = rooms[req.params.roomId],
            index = rooms.indexOf(req.params.roomId)

        rooms.splice(index,1)
        res.sendStatus(200)
        for (var i = 0; i<room.socket.length; i++) {
            room.socket[i].emit('deleted', req.params.roomId)
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
