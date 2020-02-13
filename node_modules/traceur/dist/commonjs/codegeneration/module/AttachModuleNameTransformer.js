"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AttachModuleNameTransformer: {
    enumerable: true,
    get: function() {
      return AttachModuleNameTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTreeTransformer = require("../ParseTreeTransformer.js").ParseTreeTransformer;
var $__4 = require("../../syntax/trees/ParseTrees.js"),
    Module = $__4.Module,
    Script = $__4.Script;
var AttachModuleNameTransformer = function($__super) {
  function AttachModuleNameTransformer(moduleName) {
    $__superConstructor(AttachModuleNameTransformer).call(this);
    this.moduleName_ = moduleName;
  }
  return ($__createClass)(AttachModuleNameTransformer, {
    transformModule: function(tree) {
      return new Module(tree.location, tree.scriptItemList, this.moduleName_);
    },
    transformScript: function(tree) {
      return new Script(tree.location, tree.scriptItemList, this.moduleName_);
    }
  }, {}, $__super);
}(ParseTreeTransformer);
