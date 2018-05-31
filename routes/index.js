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
      var userEmail = req.user.emails[0].value;
      var userExistsPromise = new Promise(function(resolve,reject){
        var usersRef = firebase.database().ref("users/");
        usersRef.orderByChild('email').equalTo(userEmail).once('value', function(snapshot) {
          var exists = (snapshot.val() !== null);
          resolve(exists);
        });
      });
      userExistsPromise.then(isExists => {
        if (isExists) {
          res.redirect('/home');
        } else {
          var addUserPromise = new Promise(function(resolve,reject){
            var userRef = firebase.database().ref("users/");
            var newUserKey = firebase.database().ref("users/").push().key;
            var postData = {
              name : req.user.displayName,
              character : 'student',
              email : userEmail
            };
            var updates = {};
            updates[newUserKey] = postData;
            userRef.update(updates);
            resolve("Add Ner User Success");
          });
          addUserPromise.then( message => {
            console.log(message);
            res.redirect('/home');  
          });
        }
      });
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

  router.get('/screen-broadcast', function(req, res) {
    res.render('Scalable-Screen-Broadcast');
  });

  router.get('/addSlide', function(req, res) {
    res.render('addSlide',
     { user: req.user }
    );
  });

  router.get('/getLiveUrl',function(req,res){
    var courseRef = firebase.database().ref("/courses").child(req.query.courseName);
    courseRef.on("value",function(data){
      var btnPromise = new Promise(function(resolve, reject){
        resolve(data.val().live);
      });
      btnPromise.then(value => {
          res.send(value);
      });
    });
  });

  router.post('/note-taking', ensureAuthenticated, function(req, res) {

    res.render('note-taking', {
        user: req.user,
        title : req.body.title,
      });   
  });

  router.post('/note', ensureAuthenticated, function(req, res) {
    var charaRef = firebase.database().ref("users/");
    charaRef.orderByChild('email').equalTo(req.user.emails[0].value).on('child_added',function(data){
      if(data.val().character == "teacher"){
          res.render('note-watching', {
            user: req.user,
            title : req.body.title,
            pptUrl : req.body.pptUrl,
            courseName : req.body.courseName,
            character : "teacher"
        });
      }else{
        res.render('note-taking', {
          user: req.user,
          title : req.body.title,
          pptUrl : req.body.pptUrl,
          courseName : req.body.courseName,
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