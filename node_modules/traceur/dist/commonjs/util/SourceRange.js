"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SourceRange: {
    enumerable: true,
    get: function() {
      return SourceRange;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var SourceRange = function() {
  function SourceRange(start, end) {
    this.start = start;
    this.end = end;
  }
  return ($__createClass)(SourceRange, {toString: function() {
      var str = this.start.source.contents;
      return str.slice(this.start.offset, this.end.offset);
    }}, {});
}();
