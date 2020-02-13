"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  assert: {
    enumerable: true,
    get: function() {
      return assert;
    }
  }
});
function assert(b) {
  if (!b && $traceurRuntime.options.debug)
    throw Error('Assertion failed');
}
