"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return getTemplateObject;
    }
  }
});
var $__1 = Object,
    defineProperty = $__1.defineProperty,
    freeze = $__1.freeze;
var slice = Array.prototype.slice;
var map = Object.create(null);
function getTemplateObject(raw) {
  var cooked = arguments[1];
  var key = raw.join('${}');
  var templateObject = map[key];
  if (templateObject)
    return templateObject;
  if (!cooked) {
    cooked = slice.call(raw);
  }
  return map[key] = freeze(defineProperty(cooked, 'raw', {value: freeze(raw)}));
}
