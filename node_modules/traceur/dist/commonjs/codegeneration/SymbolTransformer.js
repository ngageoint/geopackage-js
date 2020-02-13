"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SymbolTransformer: {
    enumerable: true,
    get: function() {
      return SymbolTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__7 = require("../syntax/trees/ParseTrees.js"),
    BinaryExpression = $__7.BinaryExpression,
    UnaryExpression = $__7.UnaryExpression;
var $__8 = require("../syntax/trees/ParseTreeType.js"),
    IDENTIFIER_EXPRESSION = $__8.IDENTIFIER_EXPRESSION,
    LITERAL_EXPRESSION = $__8.LITERAL_EXPRESSION,
    UNARY_EXPRESSION = $__8.UNARY_EXPRESSION;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var $__11 = require("../syntax/TokenType.js"),
    EQUAL_EQUAL = $__11.EQUAL_EQUAL,
    EQUAL_EQUAL_EQUAL = $__11.EQUAL_EQUAL_EQUAL,
    NOT_EQUAL = $__11.NOT_EQUAL,
    NOT_EQUAL_EQUAL = $__11.NOT_EQUAL_EQUAL,
    TYPEOF = $__11.TYPEOF;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
function isEqualityExpression(tree) {
  switch (tree.operator.type) {
    case EQUAL_EQUAL:
    case EQUAL_EQUAL_EQUAL:
    case NOT_EQUAL:
    case NOT_EQUAL_EQUAL:
      return true;
  }
  return false;
}
function isTypeof(tree) {
  return tree.type === UNARY_EXPRESSION && tree.operator.type === TYPEOF;
}
function isSafeTypeofString(tree) {
  if (tree.type !== LITERAL_EXPRESSION)
    return false;
  var value = tree.literalToken.processedValue;
  switch (value) {
    case 'symbol':
    case 'object':
      return false;
  }
  return true;
}
var SymbolTransformer = function($__super) {
  function SymbolTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(SymbolTransformer).call(this);
    this.identifierGenerator = identifierGenerator;
    this.reporter = reporter;
    this.options = options;
  }
  return ($__createClass)(SymbolTransformer, {
    transformTypeofOperand_: function(tree) {
      var operand = this.transformAny(tree.operand);
      return new UnaryExpression(tree.location, tree.operator, operand);
    },
    transformBinaryExpression: function(tree) {
      if (isEqualityExpression(tree)) {
        if (isTypeof(tree.left) && isSafeTypeofString(tree.right)) {
          var left = this.transformTypeofOperand_(tree.left);
          var right = tree.right;
          return new BinaryExpression(tree.location, left, tree.operator, right);
        }
        if (isTypeof(tree.right) && isSafeTypeofString(tree.left)) {
          var left$__1 = tree.left;
          var right$__2 = this.transformTypeofOperand_(tree.right);
          return new BinaryExpression(tree.location, left$__1, tree.operator, right$__2);
        }
      }
      return $__superGet(this, SymbolTransformer.prototype, "transformBinaryExpression").call(this, tree);
    },
    transformUnaryExpression: function(tree) {
      if (tree.operator.type !== TYPEOF)
        return $__superGet(this, SymbolTransformer.prototype, "transformUnaryExpression").call(this, tree);
      var operand = this.transformAny(tree.operand);
      var expression = this.getRuntimeTypeof(operand);
      if (operand.type === IDENTIFIER_EXPRESSION) {
        return parseExpression($__getTemplateObject(["(typeof ", " === 'undefined' ?\n          'undefined' : ", ")"]), operand, expression);
      }
      return expression;
    },
    getRuntimeTypeof: function(operand) {
      var typeOf = this.getRuntimeExpression('typeof');
      return parseExpression($__getTemplateObject(["", "(", ")"]), typeOf, operand);
    }
  }, {}, $__super);
}(ImportRuntimeTrait(ParseTreeTransformer));
