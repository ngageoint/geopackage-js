"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  RewriteTailExpressionsTransformer: {
    enumerable: true,
    get: function() {
      return RewriteTailExpressionsTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__4 = require("../syntax/trees/ParseTrees.js"),
    ArgumentList = $__4.ArgumentList,
    BinaryExpression = $__4.BinaryExpression,
    CallExpression = $__4.CallExpression,
    ConditionalExpression = $__4.ConditionalExpression,
    MemberExpression = $__4.MemberExpression,
    MemberLookupExpression = $__4.MemberLookupExpression;
var $__5 = require("./ParseTreeFactory.js"),
    createArrayLiteral = $__5.createArrayLiteral,
    createAssignmentExpression = $__5.createAssignmentExpression,
    createCommaExpression = $__5.createCommaExpression,
    createMemberExpression = $__5.createMemberExpression,
    id = $__5.createIdentifierExpression,
    createNullLiteral = $__5.createNullLiteral,
    createParenExpression = $__5.createParenExpression;
var $__6 = require("../syntax/trees/ParseTreeType.js"),
    COMMA_EXPRESSION = $__6.COMMA_EXPRESSION,
    MEMBER_EXPRESSION = $__6.MEMBER_EXPRESSION,
    MEMBER_LOOKUP_EXPRESSION = $__6.MEMBER_LOOKUP_EXPRESSION,
    IDENTIFIER_EXPRESSION = $__6.IDENTIFIER_EXPRESSION,
    PAREN_EXPRESSION = $__6.PAREN_EXPRESSION,
    THIS_EXPRESSION = $__6.THIS_EXPRESSION;
var $__7 = require("../syntax/TokenType.js"),
    AND = $__7.AND,
    OR = $__7.OR;
function createCall(tree, operand, thisArg, importRuntimeTransformer) {
  var argList = tree.args;
  var argArray = argList ? argList.args : [];
  argArray = argArray.map(function(arg) {
    if (arg.type === COMMA_EXPRESSION) {
      return createParenExpression(arg.type);
    }
    return arg;
  });
  var continuation = importRuntimeTransformer.getRuntimeExpression('continuation');
  return new CallExpression(tree.location, continuation, new ArgumentList(argList ? argList.location : null, [operand, thisArg, createArrayLiteral(argArray)]));
}
var RewriteTailExpressionsTransformer = function($__super) {
  function RewriteTailExpressionsTransformer(bodyTransformer) {
    $__superConstructor(RewriteTailExpressionsTransformer).call(this);
    this.bodyTransformer_ = bodyTransformer;
  }
  return ($__createClass)(RewriteTailExpressionsTransformer, {
    transformBinaryExpression: function(tree) {
      var operator = tree.operator;
      if (operator.type !== AND && operator.type !== OR) {
        return tree;
      }
      var right = this.transformAny(tree.right);
      if (right !== tree.right) {
        return new BinaryExpression(tree.location, tree.left, operator, right);
      }
      return tree;
    },
    transformCallExpression: function(tree) {
      var operand = tree.operand;
      while (operand.type === PAREN_EXPRESSION) {
        operand = operand.expression;
      }
      switch (operand.type) {
        case IDENTIFIER_EXPRESSION:
          return createCall(tree, operand, createNullLiteral(), this.bodyTransformer_);
        case MEMBER_EXPRESSION:
        case MEMBER_LOOKUP_EXPRESSION:
          return this.transformMemberExpressionCall_(tree, operand);
      }
      return tree;
    },
    transformMemberExpressionCall_: function(tree, operand) {
      var object = operand.operand;
      var thisArg;
      var assignment;
      if (object.type === IDENTIFIER_EXPRESSION || object.type === THIS_EXPRESSION) {
        thisArg = object;
      } else {
        thisArg = id(this.bodyTransformer_.addTempVar());
        assignment = createAssignmentExpression(thisArg, operand.operand);
      }
      if (operand.type === MEMBER_EXPRESSION) {
        operand = new MemberExpression(operand.location, thisArg, operand.memberName);
      } else {
        operand = new MemberLookupExpression(operand.location, thisArg, operand.memberExpression);
      }
      if (assignment) {
        return createParenExpression(createCommaExpression([assignment, createCall(tree, operand, thisArg, this.bodyTransformer_)]));
      } else {
        return createCall(tree, operand, thisArg, this.bodyTransformer_);
      }
    },
    transformCommaExpression: function(tree) {
      var expressions = tree.expressions;
      var expression = expressions[expressions.length - 1];
      var transformedExpression = this.transformAny(expression);
      if (expression !== transformedExpression) {
        expressions = expressions.slice(0, -1);
        expressions.push(transformedExpression);
        return new CommaExpression(tree.location, expressions);
      }
      return tree;
    },
    transformConditionalExpression: function(tree) {
      var left = this.transformAny(tree.left);
      var right = this.transformAny(tree.right);
      if (left !== tree.left || right !== tree.right) {
        return new ConditionalExpression(tree.location, tree.condition, left, right);
      }
      return tree;
    },
    transformNewExpression: function(tree) {
      var construct = this.bodyTransformer_.getRuntimeExpression('construct');
      return createCall(tree, construct, tree.operand, this.bodyTransformer_);
    },
    transformArrayLiteral: function(tree) {
      return tree;
    },
    transformArrowFunction: function(tree) {
      return tree;
    },
    transformFunctionExpression: function(tree) {
      return tree;
    },
    transformIdentifierExpression: function(tree) {
      return tree;
    },
    transformLiteralExpression: function(tree) {
      return tree;
    },
    transformMemberExpression: function(tree) {
      return tree;
    },
    transformMemberLookupExpression: function(tree) {
      return tree;
    },
    transformPostfixExpression: function(tree) {
      return tree;
    },
    transformObjectLiteral: function(tree) {
      return tree;
    },
    transformUnaryExpression: function(tree) {
      return tree;
    }
  }, {transform: function(bodyTransformer, tree) {
      return new RewriteTailExpressionsTransformer(bodyTransformer).transformAny(tree);
    }}, $__super);
}(ParseTreeTransformer);
