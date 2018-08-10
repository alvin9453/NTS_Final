var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var cookieSession = require('cookie-session');
var firebase = require('firebase');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LocalStrategy = require( 'passport-local' ).Strategy;
var flash = require('connect-flash');

var authConfig = require('./config/auth')
var users = require('./routes/users');
var index = require('./routes/index')(passport);

var app = express();
/* Please paste your firebase code here.  Do not edit firebase code that you copied. Just copy and paste. Your code may look like below, for example :   */
/*var config = {
  apiKey: "<your_id>",
  authDomain: "your_project.firebaseapp.com",
  databaseURL: "https://your_project.firebaseio.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "<your_id>"
};
firebase.initializeApp(config);
*/
app.use(cookieSession({
  key: 'session',
  secret: 'SSOSESSION'
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


// Passport session setup.                                                     
//                                                                             
//   For persistent logins with sessions, Passport needs to serialize users into                                                                        
//   and deserialize users out of the session. Typically, this is as simple as 
//   storing the user ID when serializing, and finding the user by ID when     
//   deserializing.                                                            
passport.serializeUser(function(user, done) {                                  
  // done(null, user.id);                                                      
  done(null, user);                                                            
});                                                                            
                                                                               
passport.deserializeUser(function(obj, done) {                                 
  // Users.findById(obj, done);                                                
  done(null, obj);                                                             
});                                            

passport.use(new GoogleStrategy(
  authConfig.google,
  function(accessToken, refreshToken, profile, done) {
        // Typically you would query the database to find the user record
        // associated with this Google profile, then pass that object to the `done`
        // callback.
        return done(null, profile);
      }
));

passport.use(new LocalStrategy({
  passReqToCallback : true
  },
  function(req , username, password, done){
    var user = {
      displayName : 'admin',
      password : 'admin',
      photos : [
        {value : ""}
      ]
    };
    if( user.displayName != username || user.password != password){
      return done(null, false, req.flash('message' ,'登入失敗'));
    }else{
      done( null, user );
    }
  }
));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use('/', index);
app.use('/users', users);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
