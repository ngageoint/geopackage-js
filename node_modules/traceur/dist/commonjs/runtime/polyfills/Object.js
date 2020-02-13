"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  assign: {
    enumerable: true,
    get: function() {
      return assign;
    }
  },
  is: {
    enumerable: true,
    get: function() {
      return is;
    }
  },
  mixin: {
    enumerable: true,
    get: function() {
      return mixin;
    }
  },
  polyfillObject: {
    enumerable: true,
    get: function() {
      return polyfillObject;
    }
  }
});
var $__2 = require("./utils.js"),
    maybeAddFunctions = $__2.maybeAddFunctions,
    registerPolyfill = $__2.registerPolyfill;
var assign = $__interopRequire("./assign.js").default;
var $__0 = Object,
    defineProperty = $__0.defineProperty,
    getOwnPropertyDescriptor = $__0.getOwnPropertyDescriptor,
    getOwnPropertyNames = $__0.getOwnPropertyNames;
function is(left, right) {
  if (left === right)
    return left !== 0 || 1 / left === 1 / right;
  return left !== left && right !== right;
}
function mixin(target, source) {
  var props = getOwnPropertyNames(source);
  var p,
      descriptor,
      length = props.length;
  for (p = 0; p < length; p++) {
    var name = props[p];
    descriptor = getOwnPropertyDescriptor(source, props[p]);
    defineProperty(target, props[p], descriptor);
  }
  return target;
}
function polyfillObject(global) {
  var Object = global.Object;
  maybeAddFunctions(Object, ['assign', assign, 'is', is, 'mixin', mixin]);
}
registerPolyfill(polyfillObject);
