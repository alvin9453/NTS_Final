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
      res.redirect('/account');
    });

  router.get('/account', ensureAuthenticated, function(req, res) {
    console.log(req.user);
    var userRef = firebase.database().ref("users/");
    console.log(req.user.emails[0].value);
    userRef.orderByChild('email').equalTo(req.user.emails[0].value).on('child_added',function(data){
      res.render('account', {
        user: req.user,
        course: data.val().course
      });
    });


    res.render('account', {
      user: req.user
    });
  });

  router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
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


