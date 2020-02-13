"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  propName: {
    enumerable: true,
    get: function() {
      return propName;
    }
  }
});
var $__0 = require("../syntax/trees/ParseTreeType.js"),
    COMPUTED_PROPERTY_NAME = $__0.COMPUTED_PROPERTY_NAME,
    GET_ACCESSOR = $__0.GET_ACCESSOR,
    LITERAL_PROPERTY_NAME = $__0.LITERAL_PROPERTY_NAME,
    METHOD = $__0.METHOD,
    PROPERTY_NAME_ASSIGNMENT = $__0.PROPERTY_NAME_ASSIGNMENT,
    PROPERTY_NAME_SHORTHAND = $__0.PROPERTY_NAME_SHORTHAND,
    SET_ACCESSOR = $__0.SET_ACCESSOR;
var IDENTIFIER = require("../syntax/TokenType.js").IDENTIFIER;
function propName(tree) {
  switch (tree.type) {
    case LITERAL_PROPERTY_NAME:
      {
        var token = tree.literalToken;
        if (token.isKeyword() || token.type === IDENTIFIER)
          return token.toString();
        return String(tree.literalToken.processedValue);
      }
    case COMPUTED_PROPERTY_NAME:
      return '';
    case PROPERTY_NAME_SHORTHAND:
      return tree.name.toString();
    case METHOD:
    case PROPERTY_NAME_ASSIGNMENT:
    case GET_ACCESSOR:
    case SET_ACCESSOR:
      return propName(tree.name);
  }
}
