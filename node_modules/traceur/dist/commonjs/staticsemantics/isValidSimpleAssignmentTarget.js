"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return isValidSimpleAssignmentTarget;
    }
  }
});
var $__1 = require("../syntax/trees/ParseTreeType.js"),
    IDENTIFIER_EXPRESSION = $__1.IDENTIFIER_EXPRESSION,
    MEMBER_EXPRESSION = $__1.MEMBER_EXPRESSION,
    MEMBER_LOOKUP_EXPRESSION = $__1.MEMBER_LOOKUP_EXPRESSION,
    PAREN_EXPRESSION = $__1.PAREN_EXPRESSION;
function isValidSimpleAssignmentTarget(tree, isStrict) {
  switch (tree.type) {
    case IDENTIFIER_EXPRESSION:
      {
        if (!isStrict)
          return true;
        var value = tree.identifierToken.value;
        return value !== 'arguments' && value !== 'eval';
      }
    case PAREN_EXPRESSION:
      return isValidSimpleAssignmentTarget(tree.expression, isStrict);
    case MEMBER_EXPRESSION:
    case MEMBER_LOOKUP_EXPRESSION:
      return true;
    default:
      return false;
  }
}
