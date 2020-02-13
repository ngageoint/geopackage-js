"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ExplodeExpressionTransformer: {
    enumerable: true,
    get: function() {
      return ExplodeExpressionTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__16 = require("./ParseTreeFactory.js"),
    createAssignmentExpression = $__16.createAssignmentExpression,
    createCommaExpression = $__16.createCommaExpression,
    id = $__16.createIdentifierExpression,
    createMemberExpression = $__16.createMemberExpression,
    createNumberLiteral = $__16.createNumberLiteral,
    createOperatorToken = $__16.createOperatorToken,
    createParenExpression = $__16.createParenExpression;
var $__17 = require("../syntax/TokenType.js"),
    AND = $__17.AND,
    EQUAL = $__17.EQUAL,
    MINUS = $__17.MINUS,
    MINUS_EQUAL = $__17.MINUS_EQUAL,
    MINUS_MINUS = $__17.MINUS_MINUS,
    OR = $__17.OR,
    PLUS = $__17.PLUS,
    PLUS_EQUAL = $__17.PLUS_EQUAL,
    PLUS_PLUS = $__17.PLUS_PLUS;
var $__18 = require("../syntax/trees/ParseTreeType.js"),
    COMMA_EXPRESSION = $__18.COMMA_EXPRESSION,
    IDENTIFIER_EXPRESSION = $__18.IDENTIFIER_EXPRESSION,
    MEMBER_EXPRESSION = $__18.MEMBER_EXPRESSION,
    MEMBER_LOOKUP_EXPRESSION = $__18.MEMBER_LOOKUP_EXPRESSION,
    PROPERTY_NAME_ASSIGNMENT = $__18.PROPERTY_NAME_ASSIGNMENT,
    SPREAD_EXPRESSION = $__18.SPREAD_EXPRESSION,
    TEMPLATE_LITERAL_PORTION = $__18.TEMPLATE_LITERAL_PORTION;
var $__19 = require("../syntax/trees/ParseTrees.js"),
    ArgumentList = $__19.ArgumentList,
    ArrayLiteral = $__19.ArrayLiteral,
    AwaitExpression = $__19.AwaitExpression,
    BinaryExpression = $__19.BinaryExpression,
    CallExpression = $__19.CallExpression,
    ClassExpression = $__19.ClassExpression,
    ConditionalExpression = $__19.ConditionalExpression,
    MemberExpression = $__19.MemberExpression,
    MemberLookupExpression = $__19.MemberLookupExpression,
    NewExpression = $__19.NewExpression,
    ObjectLiteral = $__19.ObjectLiteral,
    PropertyNameAssignment = $__19.PropertyNameAssignment,
    SpreadExpression = $__19.SpreadExpression,
    TemplateLiteralExpression = $__19.TemplateLiteralExpression,
    TemplateSubstitution = $__19.TemplateSubstitution,
    UnaryExpression = $__19.UnaryExpression,
    YieldExpression = $__19.YieldExpression;
var assert = require("../util/assert.js").assert;
var assignmentOperatorToBinaryOperator = $__interopRequire("./assignmentOperatorToBinaryOperator.js").default;
var CommaExpressionBuilder = function() {
  function CommaExpressionBuilder(tempVar) {
    this.tempVar = tempVar;
    this.expressions = [];
  }
  return ($__createClass)(CommaExpressionBuilder, {
    add: function(tree) {
      var $__2;
      if (tree.type === COMMA_EXPRESSION)
        ($__2 = this.expressions).push.apply($__2, $__spread(getExpressions(tree)));
      return this;
    },
    build: function(tree) {
      var tempVar = this.tempVar;
      this.expressions.push(createAssignmentExpression(tempVar, tree), tempVar);
      return createCommaExpression(this.expressions);
    }
  }, {});
}();
function getResult(tree) {
  if (tree.type === COMMA_EXPRESSION)
    return tree.expressions[tree.expressions.length - 1];
  return tree;
}
function getExpressions(tree) {
  if (tree.type === COMMA_EXPRESSION)
    return tree.expressions.slice(0, -1);
  return [];
}
var ExplodeExpressionTransformer = function($__super) {
  function ExplodeExpressionTransformer(tempVarTransformer) {
    $__superConstructor(ExplodeExpressionTransformer).call(this);
    this.tempVarTransformer_ = tempVarTransformer;
  }
  return ($__createClass)(ExplodeExpressionTransformer, {
    addTempVar: function() {
      var tmpId = this.tempVarTransformer_.addTempVar();
      return id(tmpId);
    },
    transformUnaryExpression: function(tree) {
      if (tree.operator.type === PLUS_PLUS)
        return this.transformUnaryNumeric_(tree, PLUS_EQUAL);
      if (tree.operator.type === MINUS_MINUS)
        return this.transformUnaryNumeric_(tree, MINUS_EQUAL);
      var operand = this.transformAny(tree.operand);
      if (operand === tree.operand)
        return tree;
      var expressions = $__spread(getExpressions(operand), [new UnaryExpression(tree.location, tree.operator, getResult(operand))]);
      return createCommaExpression(expressions);
    },
    transformUnaryNumeric_: function(tree, operator) {
      return this.transformAny(new BinaryExpression(tree.location, tree.operand, createOperatorToken(operator), createNumberLiteral(1)));
    },
    transformPostfixExpression: function(tree) {
      if (tree.operand.type === MEMBER_EXPRESSION)
        return this.transformPostfixMemberExpression_(tree);
      if (tree.operand.type === MEMBER_LOOKUP_EXPRESSION)
        return this.transformPostfixMemberLookupExpression_(tree);
      assert(tree.operand.type === IDENTIFIER_EXPRESSION);
      var operand = tree.operand;
      var tmp = this.addTempVar();
      var operator = tree.operator.type === PLUS_PLUS ? PLUS : MINUS;
      var expressions = [createAssignmentExpression(tmp, operand), createAssignmentExpression(operand, new BinaryExpression(tree.location, tmp, createOperatorToken(operator), createNumberLiteral(1))), tmp];
      return createCommaExpression(expressions);
    },
    transformPostfixMemberExpression_: function(tree) {
      var memberName = tree.operand.memberName;
      var operand = this.transformAny(tree.operand.operand);
      var tmp = this.addTempVar();
      var memberExpression = new MemberExpression(tree.operand.location, getResult(operand), memberName);
      var operator = tree.operator.type === PLUS_PLUS ? PLUS : MINUS;
      var expressions = $__spread(getExpressions(operand), [createAssignmentExpression(tmp, memberExpression), createAssignmentExpression(memberExpression, new BinaryExpression(tree.location, tmp, createOperatorToken(operator), createNumberLiteral(1))), tmp]);
      return createCommaExpression(expressions);
    },
    transformPostfixMemberLookupExpression_: function(tree) {
      var memberExpression = this.transformAny(tree.operand.memberExpression);
      var operand = this.transformAny(tree.operand.operand);
      var tmp = this.addTempVar();
      var memberLookupExpression = new MemberLookupExpression(null, getResult(operand), getResult(memberExpression));
      var operator = tree.operator.type === PLUS_PLUS ? PLUS : MINUS;
      var expressions = $__spread(getExpressions(operand), getExpressions(memberExpression), [createAssignmentExpression(tmp, memberLookupExpression), createAssignmentExpression(memberLookupExpression, new BinaryExpression(tree.location, tmp, createOperatorToken(operator), createNumberLiteral(1))), tmp]);
      return createCommaExpression(expressions);
    },
    transformYieldExpression: function(tree) {
      if (tree.expression === null) {
        return this.createCommaExpressionBuilder_().build(new YieldExpression(tree.location, null, false));
      }
      var expression = this.transformAny(tree.expression);
      return this.createCommaExpressionBuilder_().add(expression).build(new YieldExpression(tree.location, getResult(expression), tree.isYieldFor));
    },
    transformAwaitExpression: function(tree) {
      var expression = this.transformAny(tree.expression);
      return this.createCommaExpressionBuilder_().add(expression).build(new AwaitExpression(tree.location, getResult(expression)));
    },
    transformParenExpression: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression)
        return tree;
      var result = getResult(expression);
      if (result.type === IDENTIFIER_EXPRESSION)
        return expression;
      return this.createCommaExpressionBuilder_().add(expression).build(result);
    },
    transformCommaExpression: function(tree) {
      var expressions = this.transformList(tree.expressions);
      if (expressions === tree.expressions)
        return tree;
      var builder = new CommaExpressionBuilder(null);
      for (var i = 0; i < expressions.length; i++) {
        builder.add(expressions[i]);
      }
      return createCommaExpression($__spread(builder.expressions, [getResult(expressions[expressions.length - 1])]));
    },
    transformMemberExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      return this.createCommaExpressionBuilder_().add(operand).build(new MemberExpression(tree.location, getResult(operand), tree.memberName));
    },
    transformMemberLookupExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      var memberExpression = this.transformAny(tree.memberExpression);
      return this.createCommaExpressionBuilder_().add(operand).add(memberExpression).build(new MemberLookupExpression(tree.location, getResult(operand), getResult(memberExpression)));
    },
    transformBinaryExpression: function(tree) {
      if (tree.operator.isAssignmentOperator())
        return this.transformAssignmentExpression_(tree);
      var left = this.transformAny(tree.left);
      var right = this.transformAny(tree.right);
      if (left === tree.left && right === tree.right)
        return tree;
      if (tree.operator.type === OR)
        return this.transformOr_(left, right);
      if (tree.operator.type === AND)
        return this.transformAnd_(left, right);
      var expressions = $__spread(getExpressions(left), getExpressions(right), [new BinaryExpression(tree.location, getResult(left), tree.operator, getResult(right))]);
      return createCommaExpression(expressions);
    },
    transformAssignmentExpression_: function(tree) {
      var left = tree.left;
      if (left.type === MEMBER_EXPRESSION)
        return this.transformAssignMemberExpression_(tree);
      if (left.type === MEMBER_LOOKUP_EXPRESSION)
        return this.transformAssignMemberLookupExpression_(tree);
      assert(tree.left.type === IDENTIFIER_EXPRESSION);
      if (tree.operator.type === EQUAL) {
        left = this.transformAny(left);
        var right$__3 = this.transformAny(tree.right);
        var expressions$__4 = $__spread(getExpressions(right$__3), [createAssignmentExpression(left, getResult(right$__3)), getResult(right$__3)]);
        return createCommaExpression(expressions$__4);
      }
      var right = this.transformAny(tree.right);
      var tmp = this.addTempVar();
      var binop = createOperatorToken(assignmentOperatorToBinaryOperator(tree.operator.type));
      var expressions = $__spread(getExpressions(right), [createAssignmentExpression(tmp, new BinaryExpression(tree.location, left, binop, getResult(right))), createAssignmentExpression(left, tmp), tmp]);
      return createCommaExpression(expressions);
    },
    transformAssignMemberExpression_: function(tree) {
      var left = tree.left;
      if (tree.operator.type === EQUAL) {
        var operand$__5 = this.transformAny(left.operand);
        var right$__6 = this.transformAny(tree.right);
        var expressions$__7 = $__spread(getExpressions(operand$__5), getExpressions(right$__6), [new BinaryExpression(tree.location, new MemberExpression(left.location, getResult(operand$__5), left.memberName), tree.operator, getResult(right$__6)), getResult(right$__6)]);
        return createCommaExpression(expressions$__7);
      }
      var operand = this.transformAny(left.operand);
      var right = this.transformAny(tree.right);
      var tmp = this.addTempVar();
      var memberExpression = new MemberExpression(left.location, getResult(operand), left.memberName);
      var tmp2 = this.addTempVar();
      var binop = createOperatorToken(assignmentOperatorToBinaryOperator(tree.operator.type));
      var expressions = $__spread(getExpressions(operand), getExpressions(right), [createAssignmentExpression(tmp, memberExpression), createAssignmentExpression(tmp2, new BinaryExpression(tree.location, tmp, binop, getResult(right))), createAssignmentExpression(memberExpression, tmp2), tmp2]);
      return createCommaExpression(expressions);
    },
    transformAssignMemberLookupExpression_: function(tree) {
      var left = tree.left;
      if (tree.operator.type === EQUAL) {
        var operand$__8 = this.transformAny(left.operand);
        var memberExpression$__9 = this.transformAny(left.memberExpression);
        var right$__10 = this.transformAny(tree.right);
        var expressions$__11 = $__spread(getExpressions(operand$__8), getExpressions(memberExpression$__9), getExpressions(right$__10), [new BinaryExpression(tree.location, new MemberLookupExpression(left.location, getResult(operand$__8), getResult(memberExpression$__9)), tree.operator, getResult(right$__10)), getResult(right$__10)]);
        return createCommaExpression(expressions$__11);
      }
      var operand = this.transformAny(left.operand);
      var memberExpression = this.transformAny(left.memberExpression);
      var right = this.transformAny(tree.right);
      var tmp = this.addTempVar();
      var memberLookupExpression = new MemberLookupExpression(left.location, getResult(operand), getResult(memberExpression));
      var tmp2 = this.addTempVar();
      var binop = createOperatorToken(assignmentOperatorToBinaryOperator(tree.operator.type));
      var expressions = $__spread(getExpressions(operand), getExpressions(memberExpression), getExpressions(right), [createAssignmentExpression(tmp, memberLookupExpression), createAssignmentExpression(tmp2, new BinaryExpression(tree.location, tmp, binop, getResult(right))), createAssignmentExpression(memberLookupExpression, tmp2), tmp2]);
      return createCommaExpression(expressions);
    },
    transformArrayLiteral: function(tree) {
      var elements = this.transformList(tree.elements);
      if (elements === tree.elements)
        return tree;
      var builder = this.createCommaExpressionBuilder_();
      var results = [];
      for (var i = 0; i < elements.length; i++) {
        builder.add(elements[i]);
        results.push(getResult(elements[i]));
      }
      return builder.build(new ArrayLiteral(tree.location, results));
    },
    transformObjectLiteral: function(tree) {
      var propertyNameAndValues = this.transformList(tree.propertyNameAndValues);
      if (propertyNameAndValues === tree.propertyNameAndValues)
        return tree;
      var builder = this.createCommaExpressionBuilder_();
      var results = [];
      for (var i = 0; i < propertyNameAndValues.length; i++) {
        if (propertyNameAndValues[i].type === PROPERTY_NAME_ASSIGNMENT) {
          builder.add(propertyNameAndValues[i].value);
          results.push(new PropertyNameAssignment(propertyNameAndValues[i].location, propertyNameAndValues[i].name, getResult(propertyNameAndValues[i].value)));
        } else {
          results.push(propertyNameAndValues[i]);
        }
      }
      return builder.build(new ObjectLiteral(tree.location, results));
    },
    transformTemplateLiteralExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      var elements = this.transformList(tree.elements);
      if (!operand && operand === tree.operand && elements === tree.elements)
        return tree;
      var builder = this.createCommaExpressionBuilder_();
      if (operand)
        builder.add(operand);
      var results = [];
      for (var i = 0; i < elements.length; i++) {
        if (elements[i].type === TEMPLATE_LITERAL_PORTION) {
          results.push(elements[i]);
        } else {
          var expression = elements[i].expression;
          builder.add(expression);
          var result = getResult(expression);
          results.push(new TemplateSubstitution(expression.location, result));
        }
      }
      return builder.build(new TemplateLiteralExpression(tree.location, operand && getResult(operand), results));
    },
    transformCallExpression: function(tree) {
      if (tree.operand.type === MEMBER_EXPRESSION)
        return this.transformCallMemberExpression_(tree);
      if (tree.operand.type === MEMBER_LOOKUP_EXPRESSION)
        return this.transformCallMemberLookupExpression_(tree);
      return this.transformCallAndNew_(tree, CallExpression);
    },
    transformNewExpression: function(tree) {
      return this.transformCallAndNew_(tree, NewExpression);
    },
    transformCallAndNew_: function(tree, ctor) {
      var operand = this.transformAny(tree.operand);
      var args = this.transformAny(tree.args);
      var builder = this.createCommaExpressionBuilder_().add(operand);
      var argResults = [];
      args.args.forEach(function(arg) {
        builder.add(arg);
        argResults.push(getResult(arg));
      });
      return builder.build(new ctor(tree.location, getResult(operand), new ArgumentList(args.location, argResults)));
    },
    transformCallMemberExpression_: function(tree) {
      var memberName = tree.operand.memberName;
      var operand = this.transformAny(tree.operand.operand);
      var tmp = this.addTempVar();
      var memberExpresssion = new MemberExpression(tree.operand.location, getResult(operand), memberName);
      var args = this.transformAny(tree.args);
      var expressions = $__spread(getExpressions(operand), [createAssignmentExpression(tmp, memberExpresssion)]);
      var argResults = [getResult(operand)];
      args.args.forEach(function(arg) {
        var $__2;
        ($__2 = expressions).push.apply($__2, $__spread(getExpressions(arg)));
        argResults.push(getResult(arg));
      });
      var callExpression = new CallExpression(tree.location, createMemberExpression(tmp, 'call'), new ArgumentList(args.location, argResults));
      var tmp2 = this.addTempVar();
      expressions.push(createAssignmentExpression(tmp2, callExpression), tmp2);
      return createCommaExpression(expressions);
    },
    transformCallMemberLookupExpression_: function(tree) {
      var operand = this.transformAny(tree.operand.operand);
      var memberExpression = this.transformAny(tree.operand.memberExpression);
      var tmp = this.addTempVar();
      var lookupExpresssion = new MemberLookupExpression(tree.operand.location, getResult(operand), getResult(memberExpression));
      var args = this.transformAny(tree.args);
      var expressions = $__spread(getExpressions(operand), getExpressions(memberExpression), [createAssignmentExpression(tmp, lookupExpresssion)]);
      var argResults = [getResult(operand)];
      args.args.forEach(function(arg, i) {
        var $__2;
        ($__2 = expressions).push.apply($__2, $__spread(getExpressions(arg)));
        var result = getResult(arg);
        if (tree.args.args[i].type === SPREAD_EXPRESSION)
          result = new SpreadExpression(arg.location, result);
        argResults.push(result);
      });
      var callExpression = new CallExpression(tree.location, createMemberExpression(tmp, 'call'), new ArgumentList(args.location, argResults));
      var tmp2 = this.addTempVar();
      expressions.push(createAssignmentExpression(tmp2, callExpression), tmp2);
      return createCommaExpression(expressions);
    },
    transformConditionalExpression: function(tree) {
      var condition = this.transformAny(tree.condition);
      var left = this.transformAny(tree.left);
      var right = this.transformAny(tree.right);
      if (condition === tree.condition && left === tree.left && right === tree.right)
        return tree;
      var res = this.addTempVar();
      var leftTree = createCommaExpression($__spread(getExpressions(left), [createAssignmentExpression(res, getResult(left))]));
      var rightTree = createCommaExpression($__spread(getExpressions(right), [createAssignmentExpression(res, getResult(right))]));
      var expressions = $__spread(getExpressions(condition), [new ConditionalExpression(tree.location, getResult(condition), createParenExpression(leftTree), createParenExpression(rightTree)), res]);
      return createCommaExpression(expressions);
    },
    transformOr_: function(left, right) {
      var res = this.addTempVar();
      var leftTree = createCommaExpression([createAssignmentExpression(res, getResult(left))]);
      var rightTree = createCommaExpression($__spread(getExpressions(right), [createAssignmentExpression(res, getResult(right))]));
      var expressions = $__spread(getExpressions(left), [new ConditionalExpression(left.location, getResult(left), createParenExpression(leftTree), createParenExpression(rightTree)), res]);
      return createCommaExpression(expressions);
    },
    transformAnd_: function(left, right) {
      var res = this.addTempVar();
      var leftTree = createCommaExpression($__spread(getExpressions(right), [createAssignmentExpression(res, getResult(right))]));
      var rightTree = createCommaExpression([createAssignmentExpression(res, getResult(left))]);
      var expressions = $__spread(getExpressions(left), [new ConditionalExpression(left.location, getResult(left), createParenExpression(leftTree), createParenExpression(rightTree)), res]);
      return createCommaExpression(expressions);
    },
    transformSpreadExpression: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression)
        return tree;
      var result = getResult(expression);
      if (result.type !== SPREAD_EXPRESSION)
        result = new SpreadExpression(result.location, result);
      var expressions = $__spread(getExpressions(expression), [result]);
      return createCommaExpression(expressions);
    },
    transformFunctionExpression: function(tree) {
      return this.createCommaExpressionBuilder_().build(tree);
    },
    transformArrowFunction: function(tree) {
      return this.createCommaExpressionBuilder_().build(tree);
    },
    transformClassExpression: function(tree) {
      var superClass = this.transformAny(tree.superClass);
      if (superClass === tree.superClass) {
        return this.createCommaExpressionBuilder_().build(tree);
      }
      var builder = this.createCommaExpressionBuilder_();
      builder.add(superClass);
      return builder.build(new ClassExpression(tree.location, tree.name, getResult(superClass), tree.elements, tree.annotations, tree.typeParameters));
    },
    transformFunctionBody: function(tree) {
      return tree;
    },
    createCommaExpressionBuilder_: function() {
      return new CommaExpressionBuilder(this.addTempVar());
    }
  }, {}, $__super);
}(ParseTreeTransformer);
