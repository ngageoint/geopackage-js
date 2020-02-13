"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SourceFile: {
    enumerable: true,
    get: function() {
      return SourceFile;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var LineNumberTable = require("./LineNumberTable.js").LineNumberTable;
var SourceFile = function() {
  function SourceFile(name, contents) {
    this.name = name;
    this.contents = contents;
    this.lineNumberTable = new LineNumberTable(this);
  }
  return ($__createClass)(SourceFile, {}, {});
}();
