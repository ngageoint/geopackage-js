"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  GeneratorTransformer: {
    enumerable: true,
    get: function() {
      return GeneratorTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var CPSTransformer = require("./CPSTransformer.js").CPSTransformer;
var $__8 = require("../../syntax/trees/ParseTreeType.js"),
    BINARY_EXPRESSION = $__8.BINARY_EXPRESSION,
    YIELD_EXPRESSION = $__8.YIELD_EXPRESSION;
var $__9 = require("../../syntax/trees/ParseTrees.js"),
    BinaryExpression = $__9.BinaryExpression,
    ExpressionStatement = $__9.ExpressionStatement;
var FindInFunctionScope = require("../FindInFunctionScope.js").FindInFunctionScope;
var ReturnState = require("./ReturnState.js").ReturnState;
var ImportRuntimeTrait = $__interopRequire("../ImportRuntimeTrait.js").default;
var YieldState = require("./YieldState.js").YieldState;
var $__14 = require("../ParseTreeFactory.js"),
    id = $__14.createIdentifierExpression,
    createMemberExpression = $__14.createMemberExpression,
    createUndefinedExpression = $__14.createUndefinedExpression;
var $__15 = require("../PlaceholderParser.js"),
    parseExpression = $__15.parseExpression,
    parseStatement = $__15.parseStatement,
    parseStatements = $__15.parseStatements;
function isYieldAssign(tree) {
  return tree.type === BINARY_EXPRESSION && tree.operator.isAssignmentOperator() && tree.right.type === YIELD_EXPRESSION && tree.left.isLeftHandSideExpression();
}
var YieldFinder = function($__super) {
  function YieldFinder() {
    $__superConstructor(YieldFinder).apply(this, arguments);
  }
  return ($__createClass)(YieldFinder, {visitYieldExpression: function(tree) {
      this.found = true;
    }}, {}, $__super);
}(FindInFunctionScope);
function scopeContainsYield(tree) {
  var finder = new YieldFinder();
  finder.visitAny(tree);
  return finder.found;
}
var GeneratorTransformer = function($__super) {
  function GeneratorTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(GeneratorTransformer).call(this, identifierGenerator, reporter, options);
    this.shouldAppendThrowCloseState_ = true;
  }
  return ($__createClass)(GeneratorTransformer, {
    expressionNeedsStateMachine: function(tree) {
      if (tree === null)
        return false;
      return scopeContainsYield(tree);
    },
    transformYieldExpression_: function(tree) {
      var $__2;
      var expression,
          machine;
      if (this.expressionNeedsStateMachine(tree.expression)) {
        (($__2 = this.expressionToStateMachine(tree.expression), expression = $__2.expression, machine = $__2.machine, $__2));
      } else {
        expression = this.transformAny(tree.expression);
      }
      if (tree.isYieldFor)
        return this.transformYieldForExpression_(expression, machine);
      var startState = this.allocateState();
      var fallThroughState = this.allocateState();
      var yieldMachine = this.stateToStateMachine_(new YieldState(startState, fallThroughState, expression), fallThroughState);
      if (machine)
        yieldMachine = machine.append(yieldMachine);
      if (this.shouldAppendThrowCloseState_)
        yieldMachine = yieldMachine.append(this.createThrowCloseState_());
      return yieldMachine;
    },
    transformYieldForExpression_: function(expression) {
      var machine = arguments[1];
      var gName = this.getTempIdentifier();
      this.addMachineVariable(gName);
      var g = id(gName);
      var nextName = this.getTempIdentifier();
      this.addMachineVariable(nextName);
      var next = id(nextName);
      var statements = parseStatements($__getTemplateObject(["\n        ", " = $ctx.wrapYieldStar(", "[Symbol.iterator]());\n        // received = void 0;\n        $ctx.sent = void 0;\n        // send = true; // roughly equivalent\n        $ctx.action = 'next';\n\n        for (;;) {\n          ", " = ", "[$ctx.action]($ctx.sentIgnoreThrow);\n          if (", ".done) {\n            $ctx.sent = ", ".value;\n            break;\n          }\n          yield ", ".value;\n        }"]), g, expression, next, g, next, next, next);
      var shouldAppendThrowCloseState = this.shouldAppendThrowCloseState_;
      this.shouldAppendThrowCloseState_ = false;
      statements = this.transformList(statements);
      var yieldMachine = this.transformStatementList_(statements);
      this.shouldAppendThrowCloseState_ = shouldAppendThrowCloseState;
      if (machine)
        yieldMachine = machine.append(yieldMachine);
      return yieldMachine;
    },
    transformYieldExpression: function(tree) {
      this.reporter.reportError(tree.location, 'Only \'a = yield b\' and \'var a = yield b\' currently supported.');
      return tree;
    },
    transformYieldAssign_: function(tree) {
      var shouldAppendThrowCloseState = this.shouldAppendThrowCloseState_;
      this.shouldAppendThrowCloseState_ = false;
      var machine = this.transformYieldExpression_(tree.right);
      var left = this.transformAny(tree.left);
      var sentExpression = tree.right.isYieldFor ? parseExpression($__getTemplateObject(["$ctx.sentIgnoreThrow"])) : parseExpression($__getTemplateObject(["$ctx.sent"]));
      var statement = new ExpressionStatement(tree.location, new BinaryExpression(tree.location, left, tree.operator, sentExpression));
      var assignMachine = this.statementToStateMachine_(statement);
      this.shouldAppendThrowCloseState_ = shouldAppendThrowCloseState;
      return machine.append(assignMachine);
    },
    createThrowCloseState_: function() {
      return this.statementToStateMachine_(parseStatement($__getTemplateObject(["$ctx.maybeThrow()"])));
    },
    transformExpressionStatement: function(tree) {
      var expression = tree.expression;
      if (expression.type === YIELD_EXPRESSION)
        return this.transformYieldExpression_(expression);
      if (isYieldAssign(expression))
        return this.transformYieldAssign_(expression);
      if (this.expressionNeedsStateMachine(expression)) {
        return this.expressionToStateMachine(expression).machine;
      }
      return $__superGet(this, GeneratorTransformer.prototype, "transformExpressionStatement").call(this, tree);
    },
    transformAwaitStatement: function(tree) {
      this.reporter.reportError(tree.location, 'Generator function may not have an await statement.');
      return tree;
    },
    transformReturnStatement: function(tree) {
      var $__2;
      var expression,
          machine;
      if (this.expressionNeedsStateMachine(tree.expression))
        (($__2 = this.expressionToStateMachine(tree.expression), expression = $__2.expression, machine = $__2.machine, $__2));
      else
        expression = tree.expression;
      var startState = this.allocateState();
      var fallThroughState = this.allocateState();
      var returnMachine = this.stateToStateMachine_(new ReturnState(startState, fallThroughState, this.transformAny(expression)), fallThroughState);
      if (machine)
        return machine.append(returnMachine);
      return returnMachine;
    },
    transformGeneratorBody: function(tree, name) {
      var createGeneratorInstance = this.getRuntimeExpression('createGeneratorInstance');
      return this.transformCpsFunctionBody(tree, createGeneratorInstance, name);
    }
  }, {transformGeneratorBody: function(identifierGenerator, reporter, options, body, name) {
      return new GeneratorTransformer(identifierGenerator, reporter, options).transformGeneratorBody(body, name);
    }}, $__super);
}(ImportRuntimeTrait(CPSTransformer));
;
