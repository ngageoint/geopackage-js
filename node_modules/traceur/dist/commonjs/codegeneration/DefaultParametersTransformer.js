"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  DefaultParametersTransformer: {
    enumerable: true,
    get: function() {
      return DefaultParametersTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__3 = require("../semantics/util.js"),
    isUndefined = $__3.isUndefined,
    isVoidExpression = $__3.isVoidExpression;
var FormalParameterList = require("../syntax/trees/ParseTrees.js").FormalParameterList;
var ParameterTransformer = require("./ParameterTransformer.js").ParameterTransformer;
var ARGUMENTS = require("../syntax/PredefinedName.js").ARGUMENTS;
var $__7 = require("../syntax/TokenType.js"),
    NOT_EQUAL_EQUAL = $__7.NOT_EQUAL_EQUAL,
    VAR = $__7.VAR;
var $__8 = require("./ParseTreeFactory.js"),
    createBinaryExpression = $__8.createBinaryExpression,
    createConditionalExpression = $__8.createConditionalExpression,
    createIdentifierExpression = $__8.createIdentifierExpression,
    createMemberLookupExpression = $__8.createMemberLookupExpression,
    createNumberLiteral = $__8.createNumberLiteral,
    createOperatorToken = $__8.createOperatorToken,
    createVariableStatement = $__8.createVariableStatement,
    createVoid0 = $__8.createVoid0;
function createDefaultAssignment(index, binding, initializer) {
  var argumentsExpression = createMemberLookupExpression(createIdentifierExpression(ARGUMENTS), createNumberLiteral(index));
  var assignmentExpression;
  if (initializer === null || isUndefined(initializer) || isVoidExpression(initializer)) {
    assignmentExpression = argumentsExpression;
  } else {
    assignmentExpression = createConditionalExpression(createBinaryExpression(argumentsExpression, createOperatorToken(NOT_EQUAL_EQUAL), createVoid0()), argumentsExpression, initializer);
  }
  return createVariableStatement(VAR, binding, assignmentExpression);
}
var DefaultParametersTransformer = function($__super) {
  function DefaultParametersTransformer() {
    $__superConstructor(DefaultParametersTransformer).apply(this, arguments);
  }
  return ($__createClass)(DefaultParametersTransformer, {transformFormalParameterList: function(tree) {
      var parameters = [];
      var changed = false;
      var defaultToUndefined = false;
      for (var i = 0; i < tree.parameters.length; i++) {
        var param = this.transformAny(tree.parameters[i]);
        if (param !== tree.parameters[i])
          changed = true;
        if (param.isRestParameter() || !param.parameter.initializer && !defaultToUndefined) {
          parameters.push(param);
        } else {
          defaultToUndefined = true;
          changed = true;
          this.parameterStatements.push(createDefaultAssignment(i, param.parameter.binding, param.parameter.initializer));
        }
      }
      if (!changed)
        return tree;
      return new FormalParameterList(tree.location, parameters);
    }}, {}, $__super);
}(ParameterTransformer);
