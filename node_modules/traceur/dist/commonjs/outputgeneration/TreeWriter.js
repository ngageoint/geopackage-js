"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  write: {
    enumerable: true,
    get: function() {
      return write;
    }
  },
  TreeWriter: {
    enumerable: true,
    get: function() {
      return TreeWriter;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var toSource = require("./toSource.js").toSource;
function write(tree) {
  var $__2,
      $__3;
  var options = arguments[1];
  var outputName = arguments[2] !== (void 0) ? arguments[2] : '<TreeWriter-output>';
  var sourceRoot = arguments[3];
  var $__1 = toSource(tree, options, outputName, sourceRoot),
      result = ($__2 = $__1[Symbol.iterator](), ($__3 = $__2.next()).done ? void 0 : $__3.value),
      sourceMap = ($__3 = $__2.next()).done ? void 0 : $__3.value;
  if (sourceMap)
    options.generatedSourceMap = sourceMap;
  return result;
}
var TreeWriter = function() {
  function TreeWriter() {}
  return ($__createClass)(TreeWriter, {}, {});
}();
TreeWriter.write = write;
