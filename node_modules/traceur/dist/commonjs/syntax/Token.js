"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  Token: {
    enumerable: true,
    get: function() {
      return Token;
    }
  },
  isAssignmentOperator: {
    enumerable: true,
    get: function() {
      return isAssignmentOperator;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__2 = require("./TokenType.js"),
    AMPERSAND_EQUAL = $__2.AMPERSAND_EQUAL,
    BAR_EQUAL = $__2.BAR_EQUAL,
    CARET_EQUAL = $__2.CARET_EQUAL,
    EQUAL = $__2.EQUAL,
    LEFT_SHIFT_EQUAL = $__2.LEFT_SHIFT_EQUAL,
    MINUS_EQUAL = $__2.MINUS_EQUAL,
    PERCENT_EQUAL = $__2.PERCENT_EQUAL,
    PLUS_EQUAL = $__2.PLUS_EQUAL,
    RIGHT_SHIFT_EQUAL = $__2.RIGHT_SHIFT_EQUAL,
    SLASH_EQUAL = $__2.SLASH_EQUAL,
    STAR_EQUAL = $__2.STAR_EQUAL,
    STAR_STAR_EQUAL = $__2.STAR_STAR_EQUAL,
    UNSIGNED_RIGHT_SHIFT_EQUAL = $__2.UNSIGNED_RIGHT_SHIFT_EQUAL;
var Token = function() {
  function Token(type, location) {
    this.type = type;
    this.location = location;
  }
  return ($__createClass)(Token, {
    toString: function() {
      return this.type;
    },
    isAssignmentOperator: function() {
      return isAssignmentOperator(this.type);
    },
    isKeyword: function() {
      return false;
    },
    isStrictKeyword: function() {
      return false;
    }
  }, {});
}();
function isAssignmentOperator(type) {
  switch (type) {
    case AMPERSAND_EQUAL:
    case BAR_EQUAL:
    case CARET_EQUAL:
    case EQUAL:
    case LEFT_SHIFT_EQUAL:
    case MINUS_EQUAL:
    case PERCENT_EQUAL:
    case PLUS_EQUAL:
    case RIGHT_SHIFT_EQUAL:
    case SLASH_EQUAL:
    case STAR_EQUAL:
    case STAR_STAR_EQUAL:
    case UNSIGNED_RIGHT_SHIFT_EQUAL:
      return true;
  }
  return false;
}
