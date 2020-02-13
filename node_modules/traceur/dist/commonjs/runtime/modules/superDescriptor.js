"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return superDescriptor;
    }
  }
});
var $__0 = Object,
    getOwnPropertyDescriptor = $__0.getOwnPropertyDescriptor,
    getPrototypeOf = $__0.getPrototypeOf;
function superDescriptor(homeObject, name) {
  var proto = getPrototypeOf(homeObject);
  do {
    var result = getOwnPropertyDescriptor(proto, name);
    if (result)
      return result;
    proto = getPrototypeOf(proto);
  } while (proto);
  return undefined;
}
