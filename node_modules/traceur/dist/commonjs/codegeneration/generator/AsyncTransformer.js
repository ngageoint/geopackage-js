"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AsyncTransformer: {
    enumerable: true,
    get: function() {
      return AsyncTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var AwaitState = require("./AwaitState.js").AwaitState;
var $__8 = require("../../syntax/trees/ParseTrees.js"),
    BinaryExpression = $__8.BinaryExpression,
    ExpressionStatement = $__8.ExpressionStatement;
var CPSTransformer = require("./CPSTransformer.js").CPSTransformer;
var EndState = require("./EndState.js").EndState;
var FallThroughState = require("./FallThroughState.js").FallThroughState;
var ImportRuntimeTrait = $__interopRequire("../ImportRuntimeTrait.js").default;
var $__13 = require("../../syntax/trees/ParseTreeType.js"),
    AWAIT_EXPRESSION = $__13.AWAIT_EXPRESSION,
    BINARY_EXPRESSION = $__13.BINARY_EXPRESSION,
    STATE_MACHINE = $__13.STATE_MACHINE;
var $__14 = require("../PlaceholderParser.js"),
    parseExpression = $__14.parseExpression,
    parseStatement = $__14.parseStatement,
    parseStatements = $__14.parseStatements;
var StateMachine = require("../../syntax/trees/StateMachine.js").StateMachine;
var FindInFunctionScope = require("../FindInFunctionScope.js").FindInFunctionScope;
var createUndefinedExpression = require("../ParseTreeFactory.js").createUndefinedExpression;
function isAwaitAssign(tree) {
  return tree.type === BINARY_EXPRESSION && tree.operator.isAssignmentOperator() && tree.right.type === AWAIT_EXPRESSION && tree.left.isLeftHandSideExpression();
}
var AwaitFinder = function($__super) {
  function AwaitFinder() {
    $__superConstructor(AwaitFinder).apply(this, arguments);
  }
  return ($__createClass)(AwaitFinder, {visitAwaitExpression: function(tree) {
      this.found = true;
    }}, {}, $__super);
}(FindInFunctionScope);
function scopeContainsAwait(tree) {
  var visitor = new AwaitFinder();
  visitor.visitAny(tree);
  return visitor.found;
}
var AsyncTransformer = function($__super) {
  function AsyncTransformer() {
    $__superConstructor(AsyncTransformer).apply(this, arguments);
  }
  return ($__createClass)(AsyncTransformer, {
    expressionNeedsStateMachine: function(tree) {
      if (tree === null)
        return false;
      return scopeContainsAwait(tree);
    },
    transformExpressionStatement: function(tree) {
      var expression = tree.expression;
      if (expression.type === AWAIT_EXPRESSION)
        return this.transformAwaitExpression_(expression);
      if (isAwaitAssign(expression))
        return this.transformAwaitAssign_(expression);
      if (this.expressionNeedsStateMachine(expression)) {
        return this.expressionToStateMachine(expression).machine;
      }
      return $__superGet(this, AsyncTransformer.prototype, "transformExpressionStatement").call(this, tree);
    },
    transformAwaitExpression: function(tree) {
      throw new Error('Internal error');
    },
    transformAwaitExpression_: function(tree) {
      return this.transformAwait_(tree, tree.expression, null, null);
    },
    transformAwaitAssign_: function(tree) {
      return this.transformAwait_(tree, tree.right.expression, tree.left, tree.operator);
    },
    transformAwait_: function(tree, inExpression, left, operator) {
      var $__2;
      var expression,
          machine;
      if (this.expressionNeedsStateMachine(inExpression)) {
        (($__2 = this.expressionToStateMachine(inExpression), expression = $__2.expression, machine = $__2.machine, $__2));
      } else {
        expression = this.transformAny(inExpression);
      }
      var createTaskState = this.allocateState();
      var fallThroughState = this.allocateState();
      var callbackState = left ? this.allocateState() : fallThroughState;
      var states = [];
      states.push(new AwaitState(createTaskState, callbackState, expression));
      if (left) {
        var statement = new ExpressionStatement(tree.location, new BinaryExpression(tree.location, left, operator, parseExpression($__getTemplateObject(["$ctx.value"]))));
        states.push(new FallThroughState(callbackState, fallThroughState, [statement]));
      }
      var awaitMachine = new StateMachine(createTaskState, fallThroughState, states, []);
      if (machine) {
        awaitMachine = machine.append(awaitMachine);
      }
      return awaitMachine;
    },
    transformFinally: function(tree) {
      var result = $__superGet(this, AsyncTransformer.prototype, "transformFinally").call(this, tree);
      if (result.block.type !== STATE_MACHINE) {
        return result;
      }
      this.reporter.reportError(tree.location, 'await not permitted within a finally block.');
      return result;
    },
    transformReturnStatement: function(tree) {
      var $__2;
      var expression,
          machine;
      if (this.expressionNeedsStateMachine(tree.expression)) {
        (($__2 = this.expressionToStateMachine(tree.expression), expression = $__2.expression, machine = $__2.machine, $__2));
      } else {
        expression = tree.expression || createUndefinedExpression();
      }
      var startState = this.allocateState();
      var endState = this.allocateState();
      var completeState = new FallThroughState(startState, endState, parseStatements($__getTemplateObject(["$ctx.returnValue = ", ""]), expression));
      var end = new EndState(endState);
      var returnMachine = new StateMachine(startState, this.allocateState(), [completeState, end], []);
      if (machine)
        returnMachine = machine.append(returnMachine);
      return returnMachine;
    },
    createCompleteTask_: function(result) {
      return parseStatement($__getTemplateObject(["$ctx.resolve(", ")"]), result);
    },
    transformAsyncBody: function(tree) {
      var asyncWrap = this.getRuntimeExpression('asyncWrap');
      return this.transformCpsFunctionBody(tree, asyncWrap);
    }
  }, {transformAsyncBody: function(identifierGenerator, reporter, options, body) {
      return new AsyncTransformer(identifierGenerator, reporter, options).transformAsyncBody(body);
    }}, $__super);
}(ImportRuntimeTrait(CPSTransformer));
;
