"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return newUniqueString;
    }
  }
});
var random = Math.random;
var counter = Date.now() % 1e9;
function newUniqueString() {
  return '__$' + (random() * 1e9 >>> 1) + '$' + ++counter + '$__';
}
