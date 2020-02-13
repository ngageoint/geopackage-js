"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  MakeStrictTransformer: {
    enumerable: true,
    get: function() {
      return MakeStrictTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__4 = require("../syntax/trees/ParseTrees.js"),
    FunctionBody = $__4.FunctionBody,
    Script = $__4.Script;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var createUseStrictDirective = require("./ParseTreeFactory.js").createUseStrictDirective;
var hasUseStrict = require("../semantics/util.js").hasUseStrict;
function prepend(statements) {
  return $__spread([createUseStrictDirective()], statements);
}
var MakeStrictTransformer = function($__super) {
  function MakeStrictTransformer() {
    $__superConstructor(MakeStrictTransformer).apply(this, arguments);
  }
  return ($__createClass)(MakeStrictTransformer, {
    transformScript: function(tree) {
      if (hasUseStrict(tree.scriptItemList))
        return tree;
      return new Script(tree.location, prepend(tree.scriptItemList), tree.moduleName);
    },
    transformFunctionBody: function(tree) {
      if (hasUseStrict(tree.statements))
        return tree;
      return new FunctionBody(tree.location, prepend(tree.statements));
    }
  }, {transformTree: function(tree) {
      return new MakeStrictTransformer().transformAny(tree);
    }}, $__super);
}(ParseTreeTransformer);
