"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  MAX_SAFE_INTEGER: {
    enumerable: true,
    get: function() {
      return MAX_SAFE_INTEGER;
    }
  },
  MIN_SAFE_INTEGER: {
    enumerable: true,
    get: function() {
      return MIN_SAFE_INTEGER;
    }
  },
  EPSILON: {
    enumerable: true,
    get: function() {
      return EPSILON;
    }
  },
  isFinite: {
    enumerable: true,
    get: function() {
      return NumberIsFinite;
    }
  },
  isInteger: {
    enumerable: true,
    get: function() {
      return isInteger;
    }
  },
  isNaN: {
    enumerable: true,
    get: function() {
      return NumberIsNaN;
    }
  },
  isSafeInteger: {
    enumerable: true,
    get: function() {
      return isSafeInteger;
    }
  },
  polyfillNumber: {
    enumerable: true,
    get: function() {
      return polyfillNumber;
    }
  }
});
var $__1 = require("./utils.js"),
    isNumber = $__1.isNumber,
    maybeAddConsts = $__1.maybeAddConsts,
    maybeAddFunctions = $__1.maybeAddFunctions,
    registerPolyfill = $__1.registerPolyfill,
    toInteger = $__1.toInteger;
var $abs = Math.abs;
var $isFinite = isFinite;
var $isNaN = isNaN;
var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
var MIN_SAFE_INTEGER = -Math.pow(2, 53) + 1;
var EPSILON = Math.pow(2, -52);
function NumberIsFinite(number) {
  return isNumber(number) && $isFinite(number);
}
function isInteger(number) {
  return NumberIsFinite(number) && toInteger(number) === number;
}
function NumberIsNaN(number) {
  return isNumber(number) && $isNaN(number);
}
function isSafeInteger(number) {
  if (NumberIsFinite(number)) {
    var integral = toInteger(number);
    if (integral === number)
      return $abs(integral) <= MAX_SAFE_INTEGER;
  }
  return false;
}
function polyfillNumber(global) {
  var Number = global.Number;
  maybeAddConsts(Number, ['MAX_SAFE_INTEGER', MAX_SAFE_INTEGER, 'MIN_SAFE_INTEGER', MIN_SAFE_INTEGER, 'EPSILON', EPSILON]);
  maybeAddFunctions(Number, ['isFinite', NumberIsFinite, 'isInteger', isInteger, 'isNaN', NumberIsNaN, 'isSafeInteger', isSafeInteger]);
}
registerPolyfill(polyfillNumber);
