"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  MutedErrorReporter: {
    enumerable: true,
    get: function() {
      return MutedErrorReporter;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ErrorReporter = require("./ErrorReporter.js").ErrorReporter;
var MutedErrorReporter = function($__super) {
  function MutedErrorReporter() {
    $__superConstructor(MutedErrorReporter).apply(this, arguments);
  }
  return ($__createClass)(MutedErrorReporter, {reportMessageInternal: function(location, format, args) {}}, {}, $__super);
}(ErrorReporter);
