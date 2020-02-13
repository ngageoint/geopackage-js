"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ErrorReporter: {
    enumerable: true,
    get: function() {
      return ErrorReporter;
    }
  },
  format: {
    enumerable: true,
    get: function() {
      return format;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var SourceRange = require("./SourceRange.js").SourceRange;
var ErrorReporter = function() {
  function ErrorReporter() {
    this.hadError_ = false;
  }
  return ($__createClass)(ErrorReporter, {
    reportError: function(location, message) {
      this.hadError_ = true;
      this.reportMessageInternal(location, message);
    },
    reportMessageInternal: function(location, message) {
      if (location)
        message = (location.start + ": " + message);
      console.error(message);
    },
    hadError: function() {
      return this.hadError_;
    },
    clearError: function() {
      this.hadError_ = false;
    }
  }, {});
}();
function format(location, text) {
  var args = arguments[2];
  var i = 0;
  text = text.replace(/%./g, function(s) {
    switch (s) {
      case '%s':
        return args && args[i++];
      case '%%':
        return '%';
    }
    return s;
  });
  if (location)
    text = (location + ": " + text);
  return text;
}
;
ErrorReporter.format = format;
