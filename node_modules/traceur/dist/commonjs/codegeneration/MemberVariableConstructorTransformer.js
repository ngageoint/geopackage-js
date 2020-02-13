"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  transformConstructor: {
    enumerable: true,
    get: function() {
      return transformConstructor;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var Method = require("../syntax/trees/ParseTrees.js").Method;
var SUPER_EXPRESSION = require("../syntax/trees/ParseTreeType.js").SUPER_EXPRESSION;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__7 = require("./ParseTreeFactory.js"),
    createCommaExpression = $__7.createCommaExpression,
    createExpressionStatement = $__7.createExpressionStatement,
    createFunctionBody = $__7.createFunctionBody,
    createParenExpression = $__7.createParenExpression,
    createThisExpression = $__7.createThisExpression;
var prependStatements = require("./PrependStatements.js").prependStatements;
function transformConstructor(constructor, initExpression, superClass) {
  if (superClass) {
    var transformer = new SuperCallTransformer(initExpression);
    return transformer.transformAny(constructor);
  }
  var statements = constructor.body.statements;
  var initStatement = createExpressionStatement(initExpression);
  statements = prependStatements(statements, initStatement);
  return new Method(constructor.location, false, constructor.functionKind, constructor.name, constructor.parameterList, constructor.typeAnnotation, constructor.annotations, createFunctionBody(statements), constructor.debugName);
}
var SuperCallTransformer = function($__super) {
  function SuperCallTransformer(expression) {
    $__superConstructor(SuperCallTransformer).call(this);
    this.expression = expression;
  }
  return ($__createClass)(SuperCallTransformer, {
    transformCallExpression: function(tree) {
      if (tree.operand.type === SUPER_EXPRESSION) {
        var thisExpression = createThisExpression();
        return createParenExpression(createCommaExpression([tree, this.expression, thisExpression]));
      }
      return $__superGet(this, SuperCallTransformer.prototype, "transformCallExpression").call(this, tree);
    },
    transformClassDeclaration: function(tree) {
      return tree;
    },
    transformClassExpression: function(tree) {
      return tree;
    }
  }, {}, $__super);
}(ParseTreeTransformer);
