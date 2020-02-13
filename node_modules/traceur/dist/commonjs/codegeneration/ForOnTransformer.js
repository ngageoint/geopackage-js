"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ForOnTransformer: {
    enumerable: true,
    get: function() {
      return ForOnTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__4 = require("../syntax/trees/ParseTreeType.js"),
    FOR_ON_STATEMENT = $__4.FOR_ON_STATEMENT,
    LABELLED_STATEMENT = $__4.LABELLED_STATEMENT;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var InnerForOnTransformer = require("./InnerForOnTransformer.js").InnerForOnTransformer;
var ForOnTransformer = function($__super) {
  function ForOnTransformer() {
    $__superConstructor(ForOnTransformer).apply(this, arguments);
  }
  return ($__createClass)(ForOnTransformer, {
    transformForOnStatement: function(original) {
      return this.transformForOnStatement_(original, []);
    },
    transformForOnStatement_: function(original, labelSet) {
      return InnerForOnTransformer.transform(this, $__superGet(this, ForOnTransformer.prototype, "transformForOnStatement").call(this, original), labelSet);
    },
    transformLabelledStatement: function(tree) {
      var labelSet = [tree];
      var statement;
      for (statement = tree.statement; statement.type === LABELLED_STATEMENT; statement = statement.statement) {
        labelSet.push(statement);
      }
      if (statement.type !== FOR_ON_STATEMENT) {
        return $__superGet(this, ForOnTransformer.prototype, "transformLabelledStatement").call(this, tree);
      }
      return this.transformForOnStatement_(statement, labelSet);
    }
  }, {}, $__super);
}(ImportRuntimeTrait(TempVarTransformer));
