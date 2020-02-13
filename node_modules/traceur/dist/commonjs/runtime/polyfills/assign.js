"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return assign;
    }
  }
});
var keys = Object.keys;
function assign(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    var props = source == null ? [] : keys(source);
    var p = void 0,
        length = props.length;
    for (p = 0; p < length; p++) {
      var name = props[p];
      target[name] = source[name];
    }
  }
  return target;
}
