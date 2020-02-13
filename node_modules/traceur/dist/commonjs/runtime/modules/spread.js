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
      return spread;
    }
  }
});
var checkObjectCoercible = $__interopRequire("../checkObjectCoercible.js").default;
function spread() {
  var rv = [],
      j = 0,
      iterResult;
  for (var i = 0; i < arguments.length; i++) {
    var valueToSpread = checkObjectCoercible(arguments[i]);
    if (typeof valueToSpread[Symbol.iterator] !== 'function') {
      throw new TypeError('Cannot spread non-iterable object.');
    }
    var iter = valueToSpread[Symbol.iterator]();
    while (!(iterResult = iter.next()).done) {
      rv[j++] = iterResult.value;
    }
  }
  return rv;
}
