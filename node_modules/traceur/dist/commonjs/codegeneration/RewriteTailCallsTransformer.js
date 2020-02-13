"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  RewriteTailCallsTransformer: {
    enumerable: true,
    get: function() {
      return RewriteTailCallsTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var RewriteTailExpressionsTransformer = require("./RewriteTailExpressionsTransformer.js").RewriteTailExpressionsTransformer;
var $__5 = require("../syntax/trees/ParseTrees.js"),
    ReturnStatement = $__5.ReturnStatement,
    TryStatement = $__5.TryStatement;
var SkipFunctionsTransformerTrait = $__interopRequire("./SkipFunctionsTransformerTrait.js").default;
var RewriteTailCallsTransformer = function($__super) {
  function RewriteTailCallsTransformer(bodyTransformer) {
    $__superConstructor(RewriteTailCallsTransformer).call(this);
    this.bodyTransformer_ = bodyTransformer;
  }
  return ($__createClass)(RewriteTailCallsTransformer, {
    transformReturnStatement: function(tree) {
      var expression = tree.expression;
      if (expression !== null) {
        expression = RewriteTailExpressionsTransformer.transform(this.bodyTransformer_, expression);
        if (expression !== tree.expression) {
          return new ReturnStatement(tree.location, expression);
        }
      }
      return tree;
    },
    transformTryStatement: function(tree) {
      var block;
      if (tree.finallyBlock !== null) {
        block = this.transformAny(tree.finallyBlock);
        if (block !== tree.finallyBlock) {
          return new TryStatement(tree.location, tree.body, tree.catchBlock, block);
        }
      } else {
        block = this.transformAny(tree.catchBlock);
        if (block !== tree.catchBlock) {
          return new TryStatement(tree.location, tree.body, block, tree.finallyBlock);
        }
      }
      return tree;
    },
    transformForInStatement: function(tree) {
      return tree;
    },
    transformForOfStatement: function(tree) {
      return tree;
    },
    transformForOnStatement: function(tree) {
      return tree;
    },
    transformClassDeclaration: function(tree) {
      return tree;
    },
    transformClassExpression: function(tree) {
      return tree;
    },
    transformExpressionStatement: function(tree) {
      return tree;
    },
    transformComprehensionFor: function(tree) {
      return tree;
    },
    transformVariableStatement: function(tree) {
      return tree;
    }
  }, {transform: function(bodyTransformer, tree) {
      return new RewriteTailCallsTransformer(bodyTransformer).transformAny(tree);
    }}, $__super);
}(SkipFunctionsTransformerTrait(ParseTreeTransformer));
