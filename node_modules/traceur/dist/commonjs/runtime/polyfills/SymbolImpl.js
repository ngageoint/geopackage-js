"use strict";
var $___46__46__47_new_45_unique_45_string_46_js__,
    $___46__46__47_has_45_native_45_symbols_46_js__;
var newUniqueString = ($___46__46__47_new_45_unique_45_string_46_js__ = require("../new-unique-string.js"), $___46__46__47_new_45_unique_45_string_46_js__ && $___46__46__47_new_45_unique_45_string_46_js__.__esModule && $___46__46__47_new_45_unique_45_string_46_js__ || {default: $___46__46__47_new_45_unique_45_string_46_js__}).default;
var hasNativeSymbol = ($___46__46__47_has_45_native_45_symbols_46_js__ = require("../has-native-symbols.js"), $___46__46__47_has_45_native_45_symbols_46_js__ && $___46__46__47_has_45_native_45_symbols_46_js__.__esModule && $___46__46__47_has_45_native_45_symbols_46_js__ || {default: $___46__46__47_has_45_native_45_symbols_46_js__}).default;
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
Object.defineProperties(module.exports, {
  SymbolValue: {
    get: function() {
      return SymbolValue;
    },
    enumerable: true
  },
  getOwnPropertyNames: {
    get: function() {
      return getOwnPropertyNames;
    },
    enumerable: true
  },
  keys: {
    get: function() {
      return keys;
    },
    enumerable: true
  },
  getOwnPropertySymbols: {
    get: function() {
      return getOwnPropertySymbols;
    },
    enumerable: true
  },
  default: {
    get: function() {
      return SymbolImpl;
    },
    enumerable: true
  },
  __esModule: {value: true}
});
