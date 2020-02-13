"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  hasUseStrict: {
    enumerable: true,
    get: function() {
      return hasUseStrict;
    }
  },
  isUndefined: {
    enumerable: true,
    get: function() {
      return isUndefined;
    }
  },
  isVoidExpression: {
    enumerable: true,
    get: function() {
      return isVoidExpression;
    }
  },
  isLiteralExpression: {
    enumerable: true,
    get: function() {
      return isLiteralExpression;
    }
  }
});
var $__0 = require("../syntax/trees/ParseTreeType.js"),
    IDENTIFIER_EXPRESSION = $__0.IDENTIFIER_EXPRESSION,
    LITERAL_EXPRESSION = $__0.LITERAL_EXPRESSION,
    PAREN_EXPRESSION = $__0.PAREN_EXPRESSION,
    UNARY_EXPRESSION = $__0.UNARY_EXPRESSION;
var UNDEFINED = require("../syntax/PredefinedName.js").UNDEFINED;
var VOID = require("../syntax/TokenType.js").VOID;
function hasUseStrict(list) {
  for (var i = 0; i < list.length; i++) {
    if (!list[i].isDirectivePrologue())
      return false;
    if (list[i].isUseStrictDirective())
      return true;
  }
  return false;
}
function isUndefined(tree) {
  if (tree.type === PAREN_EXPRESSION)
    return isUndefined(tree.expression);
  return tree.type === IDENTIFIER_EXPRESSION && tree.identifierToken.value === UNDEFINED;
}
function isVoidExpression(tree) {
  if (tree.type === PAREN_EXPRESSION)
    return isVoidExpression(tree.expression);
  return tree.type === UNARY_EXPRESSION && tree.operator.type === VOID && isLiteralExpression(tree.operand);
}
function isLiteralExpression(tree) {
  if (tree.type === PAREN_EXPRESSION)
    return isLiteralExpression(tree.expression);
  return tree.type === LITERAL_EXPRESSION;
}
