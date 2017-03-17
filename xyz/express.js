var express = require("express");

var app = express();

// Configure routes
require('./routes')(app);

module.exports = app;
