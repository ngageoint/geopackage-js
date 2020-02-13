"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return checkObjectCoercible;
    }
  }
});
var $TypeError = TypeError;
function checkObjectCoercible(v) {
  if (v === null || v === undefined) {
    throw new $TypeError('Value cannot be converted to an Object');
  }
  return v;
}
