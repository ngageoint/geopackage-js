"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  isPrivateSymbol: {
    enumerable: true,
    get: function() {
      return isPrivateSymbol;
    }
  },
  createPrivateSymbol: {
    enumerable: true,
    get: function() {
      return createPrivateSymbol;
    }
  },
  hasPrivate: {
    enumerable: true,
    get: function() {
      return hasPrivate;
    }
  },
  deletePrivate: {
    enumerable: true,
    get: function() {
      return deletePrivate;
    }
  },
  setPrivate: {
    enumerable: true,
    get: function() {
      return setPrivate;
    }
  },
  getPrivate: {
    enumerable: true,
    get: function() {
      return getPrivate;
    }
  }
});
var sym = $__interopRequire("./private-symbol.js");
var weak = $__interopRequire("./private-weak-map.js");
var hasWeakMap = typeof WeakMap === 'function';
var m = hasWeakMap ? weak : sym;
var isPrivateSymbol = m.isPrivateSymbol;
var createPrivateSymbol = m.createPrivateSymbol;
var hasPrivate = m.hasPrivate;
var deletePrivate = m.deletePrivate;
var setPrivate = m.setPrivate;
var getPrivate = m.getPrivate;
m.init();
