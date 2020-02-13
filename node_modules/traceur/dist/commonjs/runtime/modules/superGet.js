"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return superGet;
    }
  }
});
var superDescriptor = $__interopRequire("./superDescriptor.js").default;
function superGet(self, homeObject, name) {
  var descriptor = superDescriptor(homeObject, name);
  if (descriptor) {
    var value = descriptor.value;
    if (value)
      return value;
    if (!descriptor.get)
      return value;
    return descriptor.get.call(self);
  }
  return undefined;
}
