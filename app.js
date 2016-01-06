var config = require('./config');

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var bodyParser = require('body-parser');
var colorConsole = require('tracer').colorConsole();
var mongoose = require('mongoose');
mongoose.connect(config.mongoPath);

var routes = require('./routes/index');

var app = express();
var store = new MongoDBStore({ 
    uri: config.mongoPath,
    collection: 'mySessions'
});
store.on('error', function(error) {
    colorConsole.error(error);
});

// view engine setup
var views = [
    path.join(__dirname, 'views'),
    path.join(__dirname, 'user/views')
];
app.set('views', views);
app.set('view engine', 'jade');
app.locals.pretty = true;

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    name: config.sessionName,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie:{maxAge: 1000 * 60 * 60 * 24 * 7},
    store: store,
    /* rolling:  Force a cookie to be set on every response.
       This resets the expiration date. */
    rolling: true,    
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
//use method-override
var methodOverride = require('method-override');
app.use(methodOverride('X-HTTP-Method'));          // Microsoft
app.use(methodOverride('X-HTTP-Method-Override')); // Google/GData
app.use(methodOverride('X-Method-Override'));      // IBM

//use module user
var user = require('./user');
app.use('/user/api/', user.apiRoute);
app.use('/user/', user.route);
app.use(express.static(path.join(__dirname, 'user/public')));

app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        colorConsole.error(err.stack);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
