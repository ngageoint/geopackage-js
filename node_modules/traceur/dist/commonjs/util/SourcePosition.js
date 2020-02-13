"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SourcePosition: {
    enumerable: true,
    get: function() {
      return SourcePosition;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var SourcePosition = function() {
  function SourcePosition(source, offset) {
    this.source = source;
    this.offset = offset;
    this.line_ = -1;
    this.column_ = -1;
  }
  return ($__createClass)(SourcePosition, {
    get line() {
      if (this.line_ === -1)
        this.line_ = this.source.lineNumberTable.getLine(this.offset);
      return this.line_;
    },
    get column() {
      if (this.column_ === -1)
        this.column_ = this.source.lineNumberTable.getColumn(this.offset);
      return this.column_;
    },
    toString: function() {
      var name = this.source ? this.source.name : '';
      return (name + ":" + (this.line + 1) + ":" + (this.column + 1));
    }
  }, {});
}();
