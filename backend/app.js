var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// global config data variable 
config = require('./services/config')

var appMw = require('./services/appMiddleware')
var users = require('./user/api');

var payment = require('./payment/api');

// var wksh = require('./worksheet/api');

var storeAPIs = require('./store/api');
var libraryAPIs = require('./library/api');
var fakepayAPIs = require('./fakepay/api');
var forumAPIs = require('./forum/api');

rootDirLoc = __dirname

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json({strict:true,limit:'5mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
app.use(appMw.responseHandler)
app.use(appMw.enableCORS)
app.get('/', function (req, res, next) {
  res.success({ "message": "Workbook API v0.0.1" });
});

app.use('/user', users);
// app.use('/ws', wksh);
app.use('/subscribe', payment);
app.use('/store', storeAPIs);
app.use('/library', libraryAPIs);
app.use('/fakepay', fakepayAPIs);
app.use('/forum', forumAPIs);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('notFound#@# Route not found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace

app.use(async function (err, req, res, next) {
  let errmsg = err.message.split('#@#');
  //console.log(cfg.get)
  let showStack = await config.get('showStackTrace')
  //console.log(showStack)
  res.status(err.status || 500);
  res.send({
    status: false,
    code: errmsg[0],
    message: errmsg[1],
    error: showStack == "yes" ? err : {}
  });
});


// if (app.get('env') === 'development') {
//   app.use(function (err, req, res, next) { 
//     let errmsg = err.message.split('#@#');
//     res.status(err.status || 500);
//     res.send({
//       status: false,
//       code: errmsg[0],
//       message: errmsg[1],
//       error: err
//     });
//   });
// }

// production error handler
// no stacktraces leaked to user

// app.use(function (err, req, res, next) {
//   let errmsg = err.message.split('#@#');
//   res.status(err.status || 500);
//   res.send({
//     status: false,
//     code: errmsg[0],
//     message: errmsg[1],
//     error: {}
//   });
// });

module.exports = app;