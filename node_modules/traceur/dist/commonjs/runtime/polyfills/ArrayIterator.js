"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  entries: {
    enumerable: true,
    get: function() {
      return entries;
    }
  },
  keys: {
    enumerable: true,
    get: function() {
      return keys;
    }
  },
  values: {
    enumerable: true,
    get: function() {
      return values;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__3 = require("./utils.js"),
    toObject = $__3.toObject,
    toUint32 = $__3.toUint32,
    createIteratorResultObject = $__3.createIteratorResultObject;
var ARRAY_ITERATOR_KIND_KEYS = 1;
var ARRAY_ITERATOR_KIND_VALUES = 2;
var ARRAY_ITERATOR_KIND_ENTRIES = 3;
var ArrayIterator = function() {
  var $__1;
  function ArrayIterator() {}
  return ($__createClass)(ArrayIterator, ($__1 = {}, Object.defineProperty($__1, "next", {
    value: function() {
      var iterator = toObject(this);
      var array = iterator.iteratorObject_;
      if (!array) {
        throw new TypeError('Object is not an ArrayIterator');
      }
      var index = iterator.arrayIteratorNextIndex_;
      var itemKind = iterator.arrayIterationKind_;
      var length = toUint32(array.length);
      if (index >= length) {
        iterator.arrayIteratorNextIndex_ = Infinity;
        return createIteratorResultObject(undefined, true);
      }
      iterator.arrayIteratorNextIndex_ = index + 1;
      if (itemKind == ARRAY_ITERATOR_KIND_VALUES)
        return createIteratorResultObject(array[index], false);
      if (itemKind == ARRAY_ITERATOR_KIND_ENTRIES)
        return createIteratorResultObject([index, array[index]], false);
      return createIteratorResultObject(index, false);
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), Object.defineProperty($__1, Symbol.iterator, {
    value: function() {
      return this;
    },
    configurable: true,
    enumerable: true,
    writable: true
  }), $__1), {});
}();
function createArrayIterator(array, kind) {
  var object = toObject(array);
  var iterator = new ArrayIterator;
  iterator.iteratorObject_ = object;
  iterator.arrayIteratorNextIndex_ = 0;
  iterator.arrayIterationKind_ = kind;
  return iterator;
}
function entries() {
  return createArrayIterator(this, ARRAY_ITERATOR_KIND_ENTRIES);
}
function keys() {
  return createArrayIterator(this, ARRAY_ITERATOR_KIND_KEYS);
}
function values() {
  return createArrayIterator(this, ARRAY_ITERATOR_KIND_VALUES);
}
