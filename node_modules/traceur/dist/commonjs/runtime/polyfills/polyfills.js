"use strict";
var polyfillAll = require("./utils.js").polyfillAll;
polyfillAll(Reflect.global);
var setupGlobals = $traceurRuntime.setupGlobals;
$traceurRuntime.setupGlobals = function(global) {
  setupGlobals(global);
  polyfillAll(global);
};
