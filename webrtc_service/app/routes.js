module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // ROOM ==============================
    app.get('/room/', isLoggedIn, function(req, res){
        res.render('rooms.ejs', {
            user: req.user,
            rooms: app.get('rooms')
        });
    })
    app.get('/room/:roomId', isLoggedIn, function(req, res){
        res.render('room.ejs', {
            user: req.user,
            room: req.params.roomId
        });
    })

    app.get('/error', function(req,res){
        console.log(req)
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
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
            res.render('signup.ejs', { message: req.flash('signupMessage') });
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
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // connect jwt -----------------------------

        app.get('/auth/connect', passport.authenticate('jwt', {
            successRedirect : '/room/',
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
        var userInRoom = {},
            rooms = app.get('rooms')
        for (room in rooms){
            for(user in rooms[room].user){
                if (JSON.stringify(rooms[room].user[user]._id) === JSON.stringify(req.params.userId)) {
                    userInRoom[rooms[room].name] = {type:'url', url:'/room/'+rooms[room].name}
                }
            }
        }
        res.send(userInRoom)
    })

    app.put('/room/:roomId', isLoggedIn, function(req, res){
        res.sendStatus(200)
        var rooms = app.get('rooms'),
            roomId = req.params.roomId,
            user = req.user
        if(! rooms[roomId]){
           rooms[roomId] = {user:[], name: roomId}
        }
        if(rooms[roomId].user.length<2){
            rooms[roomId].user.push(user)
            console.log('added '+user._id+' there is '+rooms[roomId].user.length)
        }
    })

    app.delete('/room/:roomId', isLoggedIn, function(req,res){
        res.sendStatus(200)
        var room = app.get('rooms')[req.params.roomId]
        for (var i = 0; i<room.user.length; i++) {
                if (JSON.stringify(room.user[i]._id) === JSON.stringify(req.user._id)) {
                    room.user.splice(i,1)
                    console.log('removed '+req.user._id)
                    break;
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
