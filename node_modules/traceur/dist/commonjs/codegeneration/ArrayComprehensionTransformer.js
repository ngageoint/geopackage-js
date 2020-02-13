"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ArrayComprehensionTransformer: {
    enumerable: true,
    get: function() {
      return ArrayComprehensionTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ComprehensionTransformer = require("./ComprehensionTransformer.js").ComprehensionTransformer;
var createIdentifierExpression = require("./ParseTreeFactory.js").createIdentifierExpression;
var parseStatement = require("./PlaceholderParser.js").parseStatement;
var ArrayComprehensionTransformer = function($__super) {
  function ArrayComprehensionTransformer() {
    $__superConstructor(ArrayComprehensionTransformer).apply(this, arguments);
  }
  return ($__createClass)(ArrayComprehensionTransformer, {transformArrayComprehension: function(tree) {
      this.pushTempScope();
      var expression = this.transformAny(tree.expression);
      var index = createIdentifierExpression(this.getTempIdentifier());
      var result = createIdentifierExpression(this.getTempIdentifier());
      var tempVarsStatatement = parseStatement($__getTemplateObject(["var ", " = 0, ", " = [];"]), index, result);
      var statement = parseStatement($__getTemplateObject(["", "[", "++] = ", ";"]), result, index, expression);
      var returnStatement = parseStatement($__getTemplateObject(["return ", ";"]), result);
      var functionKind = null;
      result = this.transformComprehension(tree, statement, functionKind, tempVarsStatatement, returnStatement);
      this.popTempScope();
      return result;
    }}, {}, $__super);
}(ComprehensionTransformer);
