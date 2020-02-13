"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  typeof: {
    enumerable: true,
    get: function() {
      return typeOf;
    }
  }
});
var newUniqueString = $__interopRequire("../new-unique-string.js").default;
var hasNativeSymbol = $__interopRequire("../has-native-symbols.js").default;
var $create = Object.create;
var $defineProperty = Object.defineProperty;
var $freeze = Object.freeze;
var $getOwnPropertyNames = Object.getOwnPropertyNames;
var $keys = Object.keys;
var $TypeError = TypeError;
function nonEnum(value) {
  return {
    configurable: true,
    enumerable: false,
    value: value,
    writable: true
  };
}
var symbolInternalProperty = newUniqueString();
var symbolDescriptionProperty = newUniqueString();
var symbolDataProperty = newUniqueString();
var symbolValues = $create(null);
var SymbolImpl = function Symbol(description) {
  var value = new SymbolValue(description);
  if (!(this instanceof SymbolImpl))
    return value;
  throw new $TypeError('Symbol cannot be new\'ed');
};
$defineProperty(SymbolImpl.prototype, 'constructor', nonEnum(SymbolImpl));
$defineProperty(SymbolImpl.prototype, 'toString', nonEnum(function() {
  var symbolValue = this[symbolDataProperty];
  return symbolValue[symbolInternalProperty];
}));
$defineProperty(SymbolImpl.prototype, 'valueOf', nonEnum(function() {
  var symbolValue = this[symbolDataProperty];
  if (!symbolValue)
    throw $TypeError('Conversion from symbol to string');
  return symbolValue[symbolInternalProperty];
}));
function SymbolValue(description) {
  var key = newUniqueString();
  $defineProperty(this, symbolDataProperty, {value: this});
  $defineProperty(this, symbolInternalProperty, {value: key});
  $defineProperty(this, symbolDescriptionProperty, {value: description});
  $freeze(this);
  symbolValues[key] = this;
}
$defineProperty(SymbolValue.prototype, 'constructor', nonEnum(SymbolImpl));
$defineProperty(SymbolValue.prototype, 'toString', {
  value: SymbolImpl.prototype.toString,
  enumerable: false
});
$defineProperty(SymbolValue.prototype, 'valueOf', {
  value: SymbolImpl.prototype.valueOf,
  enumerable: false
});
$freeze(SymbolValue.prototype);
function isSymbolString(s) {
  return symbolValues[s];
}
function removeSymbolKeys(array) {
  var rv = [];
  for (var i = 0; i < array.length; i++) {
    if (!isSymbolString(array[i])) {
      rv.push(array[i]);
    }
  }
  return rv;
}
function getOwnPropertyNames(object) {
  return removeSymbolKeys($getOwnPropertyNames(object));
}
function keys(object) {
  return removeSymbolKeys($keys(object));
}
function getOwnPropertySymbols(object) {
  var rv = [];
  var names = $getOwnPropertyNames(object);
  for (var i = 0; i < names.length; i++) {
    var symbol = symbolValues[names[i]];
    if (symbol) {
      rv.push(symbol);
    }
  }
  return rv;
}
function polyfillSymbol(global) {
  var Object = global.Object;
  if (!hasNativeSymbol()) {
    global.Symbol = SymbolImpl;
    Object.getOwnPropertyNames = getOwnPropertyNames;
    Object.keys = keys;
    $defineProperty(Object, 'getOwnPropertySymbols', nonEnum(getOwnPropertySymbols));
  }
  if (!global.Symbol.iterator) {
    global.Symbol.iterator = global.Symbol('Symbol.iterator');
  }
  if (!global.Symbol.observer) {
    global.Symbol.observer = global.Symbol('Symbol.observer');
  }
}
var g = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : (void 0);
polyfillSymbol(g);
var typeOf = hasNativeSymbol() ? function(x) {
  return typeof x;
} : function(x) {
  return x instanceof SymbolValue ? 'symbol' : typeof x;
};
