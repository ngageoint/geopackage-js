"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  MultipleErrors: {
    enumerable: true,
    get: function() {
      return MultipleErrors;
    }
  },
  CollectingErrorReporter: {
    enumerable: true,
    get: function() {
      return CollectingErrorReporter;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ErrorReporter = require("../util/ErrorReporter.js").ErrorReporter;
var MultipleErrors = function($__super) {
  function MultipleErrors(errors) {
    $__superConstructor(MultipleErrors).call(this);
    this.message = errors ? errors.join('\n') : '';
    this.name = 'MultipleErrors';
    this.errors = errors;
  }
  return ($__createClass)(MultipleErrors, {}, {}, $__super);
}(Error);
var CollectingErrorReporter = function($__super) {
  function CollectingErrorReporter() {
    $__superConstructor(CollectingErrorReporter).call(this);
    this.errors = [];
  }
  return ($__createClass)(CollectingErrorReporter, {
    reportMessageInternal: function(location, message) {
      this.errors.push((location.start + ": " + message));
    },
    errorsAsString: function() {
      return this.toError().message;
    },
    toError: function() {
      return new MultipleErrors(this.errors);
    }
  }, {}, $__super);
}(ErrorReporter);
