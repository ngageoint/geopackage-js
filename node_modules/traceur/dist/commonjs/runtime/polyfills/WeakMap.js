"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  WeakMap: {
    enumerable: true,
    get: function() {
      return WeakMap;
    }
  },
  polyfillWeakMap: {
    enumerable: true,
    get: function() {
      return polyfillWeakMap;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__6 = require("../private.js"),
    createPrivateSymbol = $__6.createPrivateSymbol,
    deletePrivate = $__6.deletePrivate,
    getPrivate = $__6.getPrivate,
    hasPrivate = $__6.hasPrivate,
    setPrivate = $__6.setPrivate;
var $__7 = require("../frozen-data.js"),
    deleteFrozen = $__7.deleteFrozen,
    getFrozen = $__7.getFrozen,
    hasFrozen = $__7.hasFrozen,
    setFrozen = $__7.setFrozen;
var $__8 = require("./utils.js"),
    isObject = $__8.isObject,
    registerPolyfill = $__8.registerPolyfill;
var hasNativeSymbol = $__interopRequire("../has-native-symbols.js").default;
var $__2 = Object,
    defineProperty = $__2.defineProperty,
    getOwnPropertyDescriptor = $__2.getOwnPropertyDescriptor,
    isExtensible = $__2.isExtensible;
var $TypeError = TypeError;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var sentinel = {};
var WeakMap = function() {
  function WeakMap() {
    this.name_ = createPrivateSymbol();
    this.frozenData_ = [];
  }
  return ($__createClass)(WeakMap, {
    set: function(key, value) {
      if (!isObject(key))
        throw new $TypeError('key must be an object');
      if (!isExtensible(key)) {
        setFrozen(this.frozenData_, key, value);
      } else {
        setPrivate(key, this.name_, value);
      }
      return this;
    },
    get: function(key) {
      if (!isObject(key))
        return undefined;
      if (!isExtensible(key)) {
        return getFrozen(this.frozenData_, key);
      }
      return getPrivate(key, this.name_);
    },
    delete: function(key) {
      if (!isObject(key))
        return false;
      if (!isExtensible(key)) {
        return deleteFrozen(this.frozenData_, key);
      }
      return deletePrivate(key, this.name_);
    },
    has: function(key) {
      if (!isObject(key))
        return false;
      if (!isExtensible(key)) {
        return hasFrozen(this.frozenData_, key);
      }
      return hasPrivate(key, this.name_);
    }
  }, {});
}();
function needsPolyfill(global) {
  var $__4 = global,
      WeakMap = $__4.WeakMap,
      Symbol = $__4.Symbol;
  if (!WeakMap || !hasNativeSymbol()) {
    return true;
  }
  try {
    var o = {};
    var wm = new WeakMap([[o, false]]);
    return wm.get(o);
  } catch (e) {
    return false;
  }
}
function polyfillWeakMap(global) {
  if (needsPolyfill(global)) {
    global.WeakMap = WeakMap;
  }
}
registerPolyfill(polyfillWeakMap);
