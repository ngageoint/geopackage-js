"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return hasNativeSymbol;
    }
  }
});
var v = !!Object.getOwnPropertySymbols && typeof Symbol === 'function';
function hasNativeSymbol() {
  return v;
}
