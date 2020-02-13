"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  from: {
    enumerable: true,
    get: function() {
      return from;
    }
  },
  of: {
    enumerable: true,
    get: function() {
      return of;
    }
  },
  fill: {
    enumerable: true,
    get: function() {
      return fill;
    }
  },
  find: {
    enumerable: true,
    get: function() {
      return find;
    }
  },
  findIndex: {
    enumerable: true,
    get: function() {
      return findIndex;
    }
  },
  polyfillArray: {
    enumerable: true,
    get: function() {
      return polyfillArray;
    }
  }
});
var $__9 = require("./ArrayIterator.js"),
    entries = $__9.entries,
    keys = $__9.keys,
    jsValues = $__9.values;
var $__10 = require("./utils.js"),
    checkIterable = $__10.checkIterable,
    isCallable = $__10.isCallable,
    isConstructor = $__10.isConstructor,
    maybeAddFunctions = $__10.maybeAddFunctions,
    maybeAddIterator = $__10.maybeAddIterator,
    registerPolyfill = $__10.registerPolyfill,
    toInteger = $__10.toInteger,
    toLength = $__10.toLength,
    toObject = $__10.toObject;
function from(arrLike) {
  var mapFn = arguments[1];
  var thisArg = arguments[2];
  var C = this;
  var items = toObject(arrLike);
  var mapping = mapFn !== undefined;
  var k = 0;
  var arr,
      len;
  if (mapping && !isCallable(mapFn)) {
    throw TypeError();
  }
  if (checkIterable(items)) {
    arr = isConstructor(C) ? new C() : [];
    var $__3 = true;
    var $__4 = false;
    var $__5 = undefined;
    try {
      for (var $__1 = void 0,
          $__0 = (items)[Symbol.iterator](); !($__3 = ($__1 = $__0.next()).done); $__3 = true) {
        var item = $__1.value;
        {
          if (mapping) {
            arr[k] = mapFn.call(thisArg, item, k);
          } else {
            arr[k] = item;
          }
          k++;
        }
      }
    } catch ($__6) {
      $__4 = true;
      $__5 = $__6;
    } finally {
      try {
        if (!$__3 && $__0.return != null) {
          $__0.return();
        }
      } finally {
        if ($__4) {
          throw $__5;
        }
      }
    }
    arr.length = k;
    return arr;
  }
  len = toLength(items.length);
  arr = isConstructor(C) ? new C(len) : new Array(len);
  for (; k < len; k++) {
    if (mapping) {
      arr[k] = typeof thisArg === 'undefined' ? mapFn(items[k], k) : mapFn.call(thisArg, items[k], k);
    } else {
      arr[k] = items[k];
    }
  }
  arr.length = len;
  return arr;
}
function of() {
  for (var items = [],
      $__7 = 0; $__7 < arguments.length; $__7++)
    items[$__7] = arguments[$__7];
  var C = this;
  var len = items.length;
  var arr = isConstructor(C) ? new C(len) : new Array(len);
  for (var k = 0; k < len; k++) {
    arr[k] = items[k];
  }
  arr.length = len;
  return arr;
}
function fill(value) {
  var start = arguments[1] !== (void 0) ? arguments[1] : 0;
  var end = arguments[2];
  var object = toObject(this);
  var len = toLength(object.length);
  var fillStart = toInteger(start);
  var fillEnd = end !== undefined ? toInteger(end) : len;
  fillStart = fillStart < 0 ? Math.max(len + fillStart, 0) : Math.min(fillStart, len);
  fillEnd = fillEnd < 0 ? Math.max(len + fillEnd, 0) : Math.min(fillEnd, len);
  while (fillStart < fillEnd) {
    object[fillStart] = value;
    fillStart++;
  }
  return object;
}
function find(predicate) {
  var thisArg = arguments[1];
  return findHelper(this, predicate, thisArg);
}
function findIndex(predicate) {
  var thisArg = arguments[1];
  return findHelper(this, predicate, thisArg, true);
}
function findHelper(self, predicate) {
  var thisArg = arguments[2];
  var returnIndex = arguments[3] !== (void 0) ? arguments[3] : false;
  var object = toObject(self);
  var len = toLength(object.length);
  if (!isCallable(predicate)) {
    throw TypeError();
  }
  for (var i = 0; i < len; i++) {
    var value = object[i];
    if (predicate.call(thisArg, value, i, object)) {
      return returnIndex ? i : value;
    }
  }
  return returnIndex ? -1 : undefined;
}
function polyfillArray(global) {
  var $__8 = global,
      Array = $__8.Array,
      Object = $__8.Object,
      Symbol = $__8.Symbol;
  var values = jsValues;
  if (Symbol && Symbol.iterator && Array.prototype[Symbol.iterator]) {
    values = Array.prototype[Symbol.iterator];
  }
  maybeAddFunctions(Array.prototype, ['entries', entries, 'keys', keys, 'values', values, 'fill', fill, 'find', find, 'findIndex', findIndex]);
  maybeAddFunctions(Array, ['from', from, 'of', of]);
  maybeAddIterator(Array.prototype, values, Symbol);
  maybeAddIterator(Object.getPrototypeOf([].values()), function() {
    return this;
  }, Symbol);
}
registerPolyfill(polyfillArray);
