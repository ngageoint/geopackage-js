"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  StringMap: {
    enumerable: true,
    get: function() {
      return StringMap;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var StringSet = require("./StringSet.js").StringSet;
function assertString(value) {
  if (typeof value !== 'string')
    throw new TypeError();
}
var StringMap = function() {
  function StringMap() {
    this.storage_ = Object.create(null);
  }
  return ($__createClass)(StringMap, {
    set: function(key, value) {
      assertString(key);
      this.storage_[key] = value;
    },
    get: function(key) {
      assertString(key);
      return this.storage_[key];
    },
    delete: function(key) {
      assertString(key);
      delete this.storage_[key];
    },
    has: function(key) {
      assertString(key);
      return this.storage_[key] !== undefined;
    },
    keysAsArray: function() {
      return Object.keys(this.storage_);
    },
    keysAsSet: function() {
      var set = new StringSet();
      this.forEach(function(key) {
        return set.add(key);
      });
      return set;
    },
    forEach: function(func) {
      for (var key in this.storage_) {
        func(key, this.storage_[key]);
      }
    }
  }, {});
}();
