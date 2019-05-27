var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var config = require('./config/database');

var api = require('./routes/api');
var app = express();

const cors = require("cors");
app.use(cors());

/**
 * Try to connect to database
 */

mongoose.Promise = require('bluebird');
/*
mongoose.connect(config.database, { promiseLibrary: require('bluebird') })
  .then(() => console.log('connection succesful'))
  .catch((err) => {
    console.error(err.message);
    console.log("Error while connection to database. Exit process!");
    process.exit(0);
  }
  );
*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Set path to api routes
app.use('/api', api);

/**
 * Error handlers for undefined routes/methods
 */
app.put('*', function (req, res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  });
  res.end("request could not be solved!");
});
app.post('*', function (req, res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  });
  res.end("request could not be solved!");
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
