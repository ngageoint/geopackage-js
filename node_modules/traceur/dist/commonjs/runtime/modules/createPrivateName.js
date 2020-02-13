"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  createPrivateName: {
    enumerable: true,
    get: function() {
      return createPrivateName;
    }
  }
});
var create = Object.create;
var $__1 = Math,
    floor = $__1.floor,
    random = $__1.random;
var privateNames = create(null);
var counter = 0;
function newUniqueString() {
  return '__$' + floor(random() * 1e9) + '$' + ++counter + '$__';
}
function createPrivateName() {
  var s = newUniqueString();
  privateNames[s] = true;
  return s;
}
function isPrivateName(s) {
  return privateNames[s];
}
