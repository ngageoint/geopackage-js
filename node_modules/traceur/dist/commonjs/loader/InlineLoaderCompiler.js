"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  InlineLoaderCompiler: {
    enumerable: true,
    get: function() {
      return InlineLoaderCompiler;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var LoaderCompiler = require("./LoaderCompiler.js").LoaderCompiler;
var Script = require("../syntax/trees/ParseTrees.js").Script;
var InlineLoaderCompiler = function($__super) {
  function InlineLoaderCompiler(elements) {
    $__superConstructor(InlineLoaderCompiler).call(this);
    this.elements = elements;
  }
  return ($__createClass)(InlineLoaderCompiler, {
    write: function() {},
    evaluateCodeUnit: function(codeUnit) {
      var $__1;
      var tree = codeUnit.metadata.transformedTree;
      ($__1 = this.elements).push.apply($__1, $__spread(tree.scriptItemList));
    },
    toTree: function() {
      return new Script(null, this.elements, null);
    }
  }, {}, $__super);
}(LoaderCompiler);
