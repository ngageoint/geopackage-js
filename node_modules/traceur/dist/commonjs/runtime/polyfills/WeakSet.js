"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  WeakSet: {
    enumerable: true,
    get: function() {
      return WeakSet;
    }
  },
  polyfillWeakSet: {
    enumerable: true,
    get: function() {
      return polyfillWeakSet;
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
    setFrozen = $__7.setFrozen;
var $__8 = require("./utils.js"),
    isObject = $__8.isObject,
    registerPolyfill = $__8.registerPolyfill;
var hasNativeSymbol = $__interopRequire("../has-native-symbols.js").default;
var $__2 = Object,
    defineProperty = $__2.defineProperty,
    isExtensible = $__2.isExtensible;
var $TypeError = TypeError;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var WeakSet = function() {
  function WeakSet() {
    this.name_ = createPrivateSymbol();
    this.frozenData_ = [];
  }
  return ($__createClass)(WeakSet, {
    add: function(value) {
      if (!isObject(value))
        throw new $TypeError('value must be an object');
      if (!isExtensible(value)) {
        setFrozen(this.frozenData_, value, value);
      } else {
        setPrivate(value, this.name_, true);
      }
      return this;
    },
    delete: function(value) {
      if (!isObject(value))
        return false;
      if (!isExtensible(value)) {
        return deleteFrozen(this.frozenData_, value);
      }
      return deletePrivate(value, this.name_);
    },
    has: function(value) {
      if (!isObject(value))
        return false;
      if (!isExtensible(value)) {
        return getFrozen(this.frozenData_, value) === value;
      }
      return hasPrivate(value, this.name_);
    }
  }, {});
}();
function needsPolyfill(global) {
  var $__4 = global,
      WeakSet = $__4.WeakSet,
      Symbol = $__4.Symbol;
  if (!WeakSet || !hasNativeSymbol()) {
    return true;
  }
  try {
    var o = {};
    var wm = new WeakSet([[o]]);
    return !wm.has(o);
  } catch (e) {
    return false;
  }
}
function polyfillWeakSet(global) {
  if (needsPolyfill(global)) {
    global.WeakSet = WeakSet;
  }
}
registerPolyfill(polyfillWeakSet);
