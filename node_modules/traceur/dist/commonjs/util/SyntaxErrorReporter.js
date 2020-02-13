"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SyntaxErrorReporter: {
    enumerable: true,
    get: function() {
      return SyntaxErrorReporter;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__3 = require("./ErrorReporter.js"),
    ErrorReporter = $__3.ErrorReporter,
    format = $__3.format;
var SyntaxErrorReporter = function($__super) {
  function SyntaxErrorReporter() {
    $__superConstructor(SyntaxErrorReporter).apply(this, arguments);
  }
  return ($__createClass)(SyntaxErrorReporter, {reportMessageInternal: function(location, message) {
      var s = format(location, message);
      throw new SyntaxError(s);
    }}, {}, $__super);
}(ErrorReporter);
