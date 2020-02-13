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
  },
  init: {
    enumerable: true,
    get: function() {
      return init;
    }
  }
});
var newUniqueString = $__interopRequire("./new-unique-string.js").default;
var $Symbol = typeof Symbol === 'function' ? Symbol : undefined;
var $getOwnPropertySymbols = Object.getOwnPropertySymbols;
var $create = Object.create;
var privateNames = $create(null);
function isPrivateSymbol(s) {
  return privateNames[s];
}
;
function createPrivateSymbol() {
  var s = ($Symbol || newUniqueString)();
  privateNames[s] = true;
  return s;
}
;
function hasPrivate(obj, sym) {
  return hasOwnProperty.call(obj, sym);
}
;
function deletePrivate(obj, sym) {
  if (!hasPrivate(obj, sym)) {
    return false;
  }
  delete obj[sym];
  return true;
}
;
function setPrivate(obj, sym, val) {
  obj[sym] = val;
}
;
function getPrivate(obj, sym) {
  var val = obj[sym];
  if (val === undefined)
    return undefined;
  return hasOwnProperty.call(obj, sym) ? val : undefined;
}
;
function init() {
  if ($getOwnPropertySymbols) {
    Object.getOwnPropertySymbols = function getOwnPropertySymbols(object) {
      var rv = [];
      var symbols = $getOwnPropertySymbols(object);
      for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i];
        if (!isPrivateSymbol(symbol)) {
          rv.push(symbol);
        }
      }
      return rv;
    };
  }
}
