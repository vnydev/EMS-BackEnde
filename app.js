var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
mongoose.connect('mongodb://localhost:27017/EMS_DB', {
  // useMongoClient: true,
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("server connected with db");
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin',"*");
     // res.header('Access-Control-Allow-Methods',"GET-POST");
  res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
   next();
  });
 
//Express Session
app.use(session({
  secret:'secret',
  saveUninitialized:true,
  resave:true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
// app.use(expressValidator({
//   errorFormatter:function(param, msg, value){
//     var namespace = param.split('.'),
//     root = namespace.shift(),
//     formParam = root;

//     while(namespace.length){
//       formParam += '[' + namespace.shift() + ']';
//     }
//     return {
//       'param':formParam,
//       'msg':msg,
//       'value':value
//     }
//   }
// }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
