var express = require('express');
var router = express.Router();
var firebase = require('firebase');

module.exports = function(passport){

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { user: req.user });
  });


  router.get('/login', function(req, res) {
    res.render('login', {
      user: req.user
    });
  });

  // GET /auth/google
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in Google authentication will involve
  //   redirecting the user to google.com.  After authorization, Google
  //   will redirect the user back to this application at /auth/google/callback
  router.get('/auth/google',
    passport.authenticate('google', { scope: ['openid email profile'] }));

  // GET /auth/google/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  router.get('/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/'
    }),
    function(req, res) {
      // Authenticated successfully
      res.redirect('/home');
    });

  router.get('/home', ensureAuthenticated, function(req, res) {
    res.render('home', {
        user: req.user
      });   
  });

  router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  router.get('/note', function(req, res) {
    res.redirect('/home');
  }); 

  router.post('/note-taking', ensureAuthenticated, function(req, res) {

    res.render('note-taking', {
        user: req.user,
        title : req.body.title,
      });   
  });

  router.post('/note', ensureAuthenticated, function(req, res) {
    var charaRef = firebase.database().ref("users/");
    console.log(req.user.emails[0].value);
    charaRef.orderByChild('email').equalTo(req.user.emails[0].value).on('child_added',function(data){
      if(data.val().character == "teacher"){
          res.render('note-watching', {
            user: req.user,
            title : req.body.title,
            character : "teacher"
        });
      }else if(data.val().character == "student"){
        res.render('note-taking', {
          user: req.user,
          title : req.body.title,
          character : "student"
        });
      }
    });
  });


  return router;
}

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}


