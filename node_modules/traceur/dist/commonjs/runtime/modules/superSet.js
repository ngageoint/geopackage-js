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
      return superSet;
    }
  }
});
var superDescriptor = $__interopRequire("./superDescriptor.js").default;
var $TypeError = TypeError;
function superSet(self, homeObject, name, value) {
  var descriptor = superDescriptor(homeObject, name);
  if (descriptor && descriptor.set) {
    descriptor.set.call(self, value);
    return value;
  }
  throw $TypeError(("super has no setter '" + name + "'."));
}
