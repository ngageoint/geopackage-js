"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  StringSet: {
    enumerable: true,
    get: function() {
      return StringSet;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
function assertString(value) {
  if (typeof value !== 'string')
    throw new TypeError();
}
var StringSet = function() {
  function StringSet() {
    this.storage_ = Object.create(null);
  }
  return ($__createClass)(StringSet, {
    add: function(value) {
      assertString(value);
      this.storage_[value] = true;
    },
    has: function(value) {
      assertString(value);
      return this.storage_[value] !== undefined;
    },
    delete: function(value) {
      assertString(value);
      delete this.storage_[value];
    },
    isEmpty: function() {
      for (var _ in this.storage_) {
        return false;
      }
      return true;
    },
    valuesAsArray: function() {
      return Object.keys(this.storage_);
    },
    forEach: function(func) {
      for (var value in this.storage_) {
        func(value);
      }
    }
  }, {});
}();
