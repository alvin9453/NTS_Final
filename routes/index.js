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
      isUserExists(req , res);
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

  router.get('/tutorials', function(req, res) {
    res.render('tutorials');
  });

  router.get('/note', function(req, res) {
    res.redirect('/home');
  }); 

  router.get('/addSlide', function(req, res) {
    res.render('addSlide',
     { user: req.user }
    );
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
      console.log("Data : ", data);
      if(data.val().character == "teacher"){
          res.render('note-watching', {
            user: req.user,
            title : req.body.title,
            pptUrl : req.body.pptUrl,
            character : "teacher"
        });
      }else{
        res.render('note-taking', {
          user: req.user,
          title : req.body.title,
          pptUrl : req.body.pptUrl,
          character : "student"
        });
      }
    });
  });
  router.post('/addSlide',  function(req, res) {
    var courseName = req.body.courseName;
    var pptTitle = req.body.pptTitle;
    var pptUrl = req.body.pptUrl;
    pptUrl = pptUrl.replace(/\"/g,"'");
    var courseRef = firebase.database().ref('courses/' + courseName +  '/slides/');
    var newCourseKey = firebase.database().ref('courses/' + courseName + '/slides/').push().key;
    var postData = {
      title : pptTitle,
      url : pptUrl
    };
    var updates = {};
    updates[newCourseKey] = postData;
    courseRef.update(updates);

    res.render('./addSlideRedirect');
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

function isUserExists(req,res) {
  var userEmail = req.user.emails[0].value;
  var usersRef = firebase.database().ref("users/");
  usersRef.orderByChild('email').equalTo(userEmail).once('value', function(snapshot) {
    console.log("snapshot : ",snapshot.val());
    var exists = (snapshot.val() !== null);
    console.log(exists);
    userExistsCallback( req.user.displayName , userEmail, exists , res);
  });
}

function userExistsCallback(userName , userEmail, exists , res) {
  if (exists) {
    console.log("Exist!");
    res.redirect('/home');
  } else {
    var userRef = firebase.database().ref("users/");
    var newUserKey = firebase.database().ref("users/").push().key;
    var postData = {
      name : userName,
      character : 'student',
      email : userEmail
    };
    var updates = {};
    updates[newUserKey] = postData;
    userRef.update(updates);
    
    console.log("Not Exist!");
    res.redirect('/home');
  }
}
