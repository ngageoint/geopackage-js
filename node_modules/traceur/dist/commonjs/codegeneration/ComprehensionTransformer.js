"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ComprehensionTransformer: {
    enumerable: true,
    get: function() {
      return ComprehensionTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var alphaRenameThisAndArguments = $__interopRequire("./alphaRenameThisAndArguments.js").default;
var FunctionExpression = require("../syntax/trees/ParseTrees.js").FunctionExpression;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__6 = require("../syntax/TokenType.js"),
    LET = $__6.LET,
    STAR = $__6.STAR,
    VAR = $__6.VAR;
var $__7 = require("../syntax/trees/ParseTreeType.js"),
    COMPREHENSION_FOR = $__7.COMPREHENSION_FOR,
    COMPREHENSION_IF = $__7.COMPREHENSION_IF;
var Token = require("../syntax/Token.js").Token;
var $__9 = require("./ParseTreeFactory.js"),
    createCallExpression = $__9.createCallExpression,
    createEmptyParameterList = $__9.createEmptyParameterList,
    createForOfStatement = $__9.createForOfStatement,
    createFunctionBody = $__9.createFunctionBody,
    createIfStatement = $__9.createIfStatement,
    createParenExpression = $__9.createParenExpression,
    createVariableDeclarationList = $__9.createVariableDeclarationList;
var ComprehensionTransformer = function($__super) {
  function ComprehensionTransformer() {
    $__superConstructor(ComprehensionTransformer).apply(this, arguments);
  }
  return ($__createClass)(ComprehensionTransformer, {transformComprehension: function(tree, statement, isGenerator) {
      var prefix = arguments[3];
      var suffix = arguments[4];
      var bindingKind = isGenerator || !this.options.blockBinding ? VAR : LET;
      var statements = prefix ? [prefix] : [];
      for (var i = tree.comprehensionList.length - 1; i >= 0; i--) {
        var item = tree.comprehensionList[i];
        switch (item.type) {
          case COMPREHENSION_IF:
            {
              var expression = this.transformAny(item.expression);
              statement = createIfStatement(expression, statement);
              break;
            }
          case COMPREHENSION_FOR:
            {
              var left = this.transformAny(item.left);
              var iterator = this.transformAny(item.iterator);
              var initializer = createVariableDeclarationList(bindingKind, left, null);
              statement = createForOfStatement(initializer, iterator, statement);
              break;
            }
          default:
            throw new Error('Unreachable.');
        }
      }
      statement = alphaRenameThisAndArguments(this, statement);
      statements.push(statement);
      if (suffix)
        statements.push(suffix);
      var functionKind = isGenerator ? new Token(STAR, null) : null;
      var func = new FunctionExpression(null, null, functionKind, createEmptyParameterList(), null, [], createFunctionBody(statements));
      return createParenExpression(createCallExpression(func));
    }}, {}, $__super);
}(TempVarTransformer);
