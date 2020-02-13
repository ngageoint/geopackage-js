"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  isTreeStrict: {
    enumerable: true,
    get: function() {
      return isTreeStrict;
    }
  }
});
var $__0 = require("../syntax/trees/ParseTreeType.js"),
    ARROW_FUNCTION = $__0.ARROW_FUNCTION,
    CLASS_DECLARATION = $__0.CLASS_DECLARATION,
    CLASS_EXPRESSION = $__0.CLASS_EXPRESSION,
    FUNCTION_BODY = $__0.FUNCTION_BODY,
    FUNCTION_DECLARATION = $__0.FUNCTION_DECLARATION,
    FUNCTION_EXPRESSION = $__0.FUNCTION_EXPRESSION,
    GET_ACCESSOR = $__0.GET_ACCESSOR,
    METHOD = $__0.METHOD,
    MODULE = $__0.MODULE,
    SCRIPT = $__0.SCRIPT,
    SET_ACCESSOR = $__0.SET_ACCESSOR;
var hasUseStrict = require("./util.js").hasUseStrict;
function isTreeStrict(tree) {
  switch (tree.type) {
    case CLASS_DECLARATION:
    case CLASS_EXPRESSION:
    case MODULE:
      return true;
    case FUNCTION_BODY:
      return hasUseStrict(tree.statements);
    case FUNCTION_EXPRESSION:
    case FUNCTION_DECLARATION:
    case METHOD:
      return isTreeStrict(tree.body);
    case ARROW_FUNCTION:
      if (tree.body.type === FUNCTION_BODY) {
        return isTreeStrict(tree.body);
      }
      return false;
    case GET_ACCESSOR:
    case SET_ACCESSOR:
      return isTreeStrict(tree.body);
    case SCRIPT:
      return hasUseStrict(tree.scriptItemList);
    default:
      return false;
  }
}
