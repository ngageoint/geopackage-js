"use strict";
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
var $WeakMap = typeof WeakMap === 'function' ? WeakMap : undefined;
function isPrivateSymbol(s) {
  return false;
}
function createPrivateSymbol() {
  return new $WeakMap();
}
function hasPrivate(obj, sym) {
  return sym.has(obj);
}
function deletePrivate(obj, sym) {
  return sym.delete(obj);
}
function setPrivate(obj, sym, val) {
  sym.set(obj, val);
}
function getPrivate(obj, sym) {
  return sym.get(obj);
}
function init() {}
