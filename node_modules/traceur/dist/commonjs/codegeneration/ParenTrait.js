"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ParenTrait: {
    enumerable: true,
    get: function() {
      return ParenTrait;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__4 = require("../syntax/trees/ParseTrees.js"),
    ArgumentList = $__4.ArgumentList,
    ArrayLiteral = $__4.ArrayLiteral,
    BinaryExpression = $__4.BinaryExpression,
    ConditionalExpression = $__4.ConditionalExpression,
    ExpressionStatement = $__4.ExpressionStatement,
    NewExpression = $__4.NewExpression,
    ParenExpression = $__4.ParenExpression,
    PropertyNameAssignment = $__4.PropertyNameAssignment,
    VariableDeclaration = $__4.VariableDeclaration;
var $__5 = require("../syntax/trees/ParseTreeType.js"),
    CALL_EXPRESSION = $__5.CALL_EXPRESSION,
    COMMA_EXPRESSION = $__5.COMMA_EXPRESSION,
    FUNCTION_EXPRESSION = $__5.FUNCTION_EXPRESSION,
    OBJECT_LITERAL = $__5.OBJECT_LITERAL,
    OBJECT_PATTERN = $__5.OBJECT_PATTERN,
    TEMPLATE_LITERAL_EXPRESSION = $__5.TEMPLATE_LITERAL_EXPRESSION,
    YIELD_EXPRESSION = $__5.YIELD_EXPRESSION;
function wrap(tree) {
  return new ParenExpression(tree.location, tree);
}
function ParenTrait(ParseTreeTransformerClass) {
  return function($__super) {
    function $__0() {
      $__superConstructor($__0).apply(this, arguments);
    }
    return ($__createClass)($__0, {
      transformVariableDeclaration: function(tree) {
        var lvalue = this.transformAny(tree.lvalue);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var initializer = this.transformAny(tree.initializer);
        if (initializer !== null && initializer.type === COMMA_EXPRESSION) {
          initializer = wrap(initializer);
        } else if (tree.lvalue === lvalue && tree.typeAnnotation === typeAnnotation && tree.initializer === initializer) {
          return tree;
        }
        return new VariableDeclaration(tree.location, lvalue, typeAnnotation, initializer);
      },
      transformExpressionStatement: function(tree) {
        var expression = this.transformAny(tree.expression);
        switch (expression.type) {
          case OBJECT_LITERAL:
          case OBJECT_PATTERN:
          case FUNCTION_EXPRESSION:
            expression = wrap(expression);
            break;
        }
        if (tree.expression === expression) {
          return tree;
        }
        return new ExpressionStatement(tree.location, expression);
      },
      transformNewExpression: function(tree) {
        var operand = this.transformAny(tree.operand);
        var args = this.transformAny(tree.args);
        switch (operand.type) {
          case CALL_EXPRESSION:
          case TEMPLATE_LITERAL_EXPRESSION:
            operand = wrap(operand);
        }
        if (operand === tree.operand && args === tree.args) {
          return tree;
        }
        return new NewExpression(tree.location, operand, args);
      },
      transformExpressionList_: function(list) {
        var expressions = this.transformList(list);
        var newList = null;
        for (var i = 0; i < list.length; i++) {
          var expression = expressions[i];
          if (expression !== null && expression.type === COMMA_EXPRESSION) {
            expression = wrap(expression);
            if (newList === null) {
              newList = expressions.slice(0, i);
            }
            newList.push(expression);
          } else if (newList !== null) {
            newList.push(expression);
          }
        }
        if (newList !== null) {
          return newList;
        }
        return expressions;
      },
      transformArgumentList: function(tree) {
        var args = this.transformExpressionList_(tree.args);
        if (tree.args === args) {
          return tree;
        }
        return new ArgumentList(tree.location, args);
      },
      transformArrayLiteral: function(tree) {
        var elements = this.transformExpressionList_(tree.elements);
        if (tree.elements === elements) {
          return tree;
        }
        return new ArrayLiteral(tree.location, elements);
      },
      transformPropertyNameAssignment: function(tree) {
        var name = this.transformAny(tree.name);
        var value = this.transformAny(tree.value);
        if (value.type === COMMA_EXPRESSION) {
          value = wrap(value);
        } else if (name === tree.name && value === tree.value) {
          return tree;
        }
        return new PropertyNameAssignment(tree.location, name, value);
      },
      transformBinaryExpression: function(tree) {
        var left = this.transformAny(tree.left);
        var right = this.transformAny(tree.right);
        if (commaOrYield(left.type)) {
          left = wrap(left);
        }
        if (commaOrYield(right.type)) {
          right = wrap(right);
        }
        if (left === tree.left && right === tree.right) {
          return tree;
        }
        return new BinaryExpression(tree.location, left, tree.operator, right);
      },
      transformConditionalExpression: function(tree) {
        var condition = this.transformAny(tree.condition);
        var left = this.transformAny(tree.left);
        var right = this.transformAny(tree.right);
        if (commaOrYield(condition.type)) {
          condition = wrap(condition);
        }
        if (left.type == COMMA_EXPRESSION) {
          left = wrap(left);
        }
        if (right.type == COMMA_EXPRESSION) {
          right = wrap(right);
        }
        if (condition === tree.condition && left === tree.left && right === tree.right) {
          return tree;
        }
        return new ConditionalExpression(tree.location, condition, left, right);
      }
    }, {}, $__super);
  }(ParseTreeTransformerClass);
}
function commaOrYield(type) {
  return type === COMMA_EXPRESSION || type == YIELD_EXPRESSION;
}
