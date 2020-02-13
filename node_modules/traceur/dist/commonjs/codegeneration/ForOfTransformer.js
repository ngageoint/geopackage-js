"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ForOfTransformer: {
    enumerable: true,
    get: function() {
      return ForOfTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__5 = require("../syntax/trees/ParseTreeType.js"),
    FOR_OF_STATEMENT = $__5.FOR_OF_STATEMENT,
    VARIABLE_DECLARATION_LIST = $__5.VARIABLE_DECLARATION_LIST,
    LABELLED_STATEMENT = $__5.LABELLED_STATEMENT;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__7 = require("./ParseTreeFactory.js"),
    id = $__7.createIdentifierExpression,
    createMemberExpression = $__7.createMemberExpression,
    createVariableStatement = $__7.createVariableStatement;
var $__8 = require("./PlaceholderParser.js"),
    parseStatement = $__8.parseStatement,
    parseStatements = $__8.parseStatements;
var $__9 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__9.AnonBlock,
    LabelledStatement = $__9.LabelledStatement;
var ForOfTransformer = function($__super) {
  function ForOfTransformer() {
    $__superConstructor(ForOfTransformer).apply(this, arguments);
  }
  return ($__createClass)(ForOfTransformer, {
    transformForOfStatement: function(original) {
      return this.transformForOfStatement_(original, []);
    },
    transformForOfStatement_: function(original, labelSet) {
      var tree = $__superGet(this, ForOfTransformer.prototype, "transformForOfStatement").call(this, original);
      var iter = id(this.getTempIdentifier());
      var result = id(this.getTempIdentifier());
      var label = id(this.getTempIdentifier());
      var normalCompletion = id(this.getTempIdentifier());
      var throwCompletion = id(this.getTempIdentifier());
      var exception = id(this.getTempIdentifier());
      var ex = id(this.getTempIdentifier());
      var labelledStatement;
      var innerStatement;
      var assignment;
      if (tree.initializer.type === VARIABLE_DECLARATION_LIST) {
        assignment = createVariableStatement(tree.initializer.declarationType, tree.initializer.declarations[0].lvalue, createMemberExpression(result, 'value'));
      } else {
        assignment = parseStatement($__getTemplateObject(["", " = ", ".value;"]), tree.initializer, result);
      }
      innerStatement = parseStatement($__getTemplateObject(["\n        for (var ", ",\n                 ", " = (", ")[Symbol.iterator]();\n             !(", " = (", " = ", ".next()).done);\n             ", " = true) {\n          ", "\n          ", "\n        }"]), result, iter, tree.collection, normalCompletion, result, iter, normalCompletion, assignment, tree.body);
      while (labelledStatement = labelSet.pop()) {
        innerStatement = new LabelledStatement(labelledStatement.location, labelledStatement.name, innerStatement);
      }
      return new AnonBlock(null, parseStatements($__getTemplateObject(["\n        var ", " = true;\n        var ", " = false;\n        var ", " = undefined;\n        try {\n          ", "\n        } catch (", ") {\n          ", " = true;\n          ", " = ", ";\n        } finally {\n          try {\n            if (!", " && ", ".return != null) {\n              ", ".return();\n            }\n          } finally {\n            if (", ") {\n              throw ", ";\n            }\n          }\n        }"]), normalCompletion, throwCompletion, exception, innerStatement, ex, throwCompletion, exception, ex, normalCompletion, iter, iter, throwCompletion, exception));
    },
    transformLabelledStatement: function(tree) {
      var labelSet = [tree];
      var statement = tree.statement;
      while (statement.type === LABELLED_STATEMENT) {
        labelSet.push(statement);
        statement = statement.statement;
      }
      if (statement.type !== FOR_OF_STATEMENT) {
        return $__superGet(this, ForOfTransformer.prototype, "transformLabelledStatement").call(this, tree);
      }
      return this.transformForOfStatement_(statement, labelSet);
    }
  }, {}, $__super);
}(TempVarTransformer);
