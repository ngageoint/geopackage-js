"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return iteratorToArray;
    }
  }
});
function iteratorToArray(iter) {
  var rv = [];
  var i = 0;
  var tmp;
  while (!(tmp = iter.next()).done) {
    rv[i++] = tmp.value;
  }
  return rv;
}
