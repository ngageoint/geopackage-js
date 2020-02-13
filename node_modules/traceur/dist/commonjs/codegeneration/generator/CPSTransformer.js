"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  CPSTransformer: {
    enumerable: true,
    get: function() {
      return CPSTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var AlphaRenamer = require("../AlphaRenamer.js").AlphaRenamer;
var BreakContinueTransformer = require("./BreakContinueTransformer.js").BreakContinueTransformer;
var $__24 = require("../../syntax/trees/ParseTreeType.js"),
    BLOCK = $__24.BLOCK,
    CASE_CLAUSE = $__24.CASE_CLAUSE,
    CONDITIONAL_EXPRESSION = $__24.CONDITIONAL_EXPRESSION,
    EXPRESSION_STATEMENT = $__24.EXPRESSION_STATEMENT,
    PAREN_EXPRESSION = $__24.PAREN_EXPRESSION,
    STATE_MACHINE = $__24.STATE_MACHINE;
var $__25 = require("../../syntax/trees/ParseTrees.js"),
    AnonBlock = $__25.AnonBlock,
    Block = $__25.Block,
    CaseClause = $__25.CaseClause,
    IfStatement = $__25.IfStatement,
    SwitchStatement = $__25.SwitchStatement;
var CatchState = require("./CatchState.js").CatchState;
var ConditionalState = require("./ConditionalState.js").ConditionalState;
var ExplodeExpressionTransformer = require("../ExplodeExpressionTransformer.js").ExplodeExpressionTransformer;
var FallThroughState = require("./FallThroughState.js").FallThroughState;
var FinallyFallThroughState = require("./FinallyFallThroughState.js").FinallyFallThroughState;
var FinallyState = require("./FinallyState.js").FinallyState;
var FindInFunctionScope = require("../FindInFunctionScope.js").FindInFunctionScope;
var ParseTreeTransformer = require("../ParseTreeTransformer.js").ParseTreeTransformer;
var StringMap = require("../../util/StringMap.js").StringMap;
var TempVarTransformer = require("../TempVarTransformer.js").TempVarTransformer;
var assert = require("../../util/assert.js").assert;
var $__37 = require("../PlaceholderParser.js"),
    parseExpression = $__37.parseExpression,
    parseStatement = $__37.parseStatement,
    parseStatements = $__37.parseStatements;
var State = require("./State.js").State;
var StateAllocator = require("./StateAllocator.js").StateAllocator;
var StateMachine = require("../../syntax/trees/StateMachine.js").StateMachine;
var $__41 = require("./SwitchState.js"),
    SwitchClause = $__41.SwitchClause,
    SwitchState = $__41.SwitchState;
var TryState = require("./TryState.js").TryState;
var $__43 = require("../ParseTreeFactory.js"),
    createAssignStateStatement = $__43.createAssignStateStatement,
    createBreakStatement = $__43.createBreakStatement,
    createCaseClause = $__43.createCaseClause,
    createDefaultClause = $__43.createDefaultClause,
    createExpressionStatement = $__43.createExpressionStatement,
    createFunctionBody = $__43.createFunctionBody,
    id = $__43.createIdentifierExpression,
    createMemberExpression = $__43.createMemberExpression,
    createNumberLiteral = $__43.createNumberLiteral,
    createSwitchStatement = $__43.createSwitchStatement;
var HoistVariablesTransformer = $__interopRequire("../HoistVariablesTransformer.js").default;
var LabelState = function() {
  function LabelState(name, continueState, fallThroughState) {
    this.name = name;
    this.continueState = continueState;
    this.fallThroughState = fallThroughState;
  }
  return ($__createClass)(LabelState, {}, {});
}();
var NeedsStateMachine = function($__super) {
  function NeedsStateMachine() {
    $__superConstructor(NeedsStateMachine).apply(this, arguments);
  }
  return ($__createClass)(NeedsStateMachine, {
    visitBreakStatement: function(tree) {
      this.found = true;
    },
    visitContinueStatement: function(tree) {
      this.found = true;
    },
    visitStateMachine: function(tree) {
      this.found = true;
    },
    visitYieldExpression: function(tee) {
      this.found = true;
    }
  }, {}, $__super);
}(FindInFunctionScope);
function needsStateMachine(tree) {
  var visitor = new NeedsStateMachine();
  visitor.visitAny(tree);
  return visitor.found;
}
var HoistVariables = function($__super) {
  function HoistVariables() {
    $__superConstructor(HoistVariables).call(this, true);
  }
  return ($__createClass)(HoistVariables, {
    prependVariables: function(statements) {
      return statements;
    },
    prependFunctions: function(statements) {
      return statements;
    }
  }, {}, $__super);
}(HoistVariablesTransformer);
var CPSTransformer = function($__super) {
  function CPSTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(CPSTransformer).call(this, identifierGenerator, reporter, options);
    this.stateAllocator_ = new StateAllocator();
    this.labelSet_ = new StringMap();
    this.currentLabel_ = null;
    this.hoistVariablesTransformer_ = new HoistVariables();
  }
  return ($__createClass)(CPSTransformer, {
    expressionNeedsStateMachine: function(tree) {
      return false;
    },
    allocateState: function() {
      return this.stateAllocator_.allocateState();
    },
    transformBlock: function(tree) {
      var labels = this.getLabels_();
      var label = this.clearCurrentLabel_();
      var transformedTree = $__superGet(this, CPSTransformer.prototype, "transformBlock").call(this, tree);
      var machine = this.transformStatementList_(transformedTree.statements);
      if (machine === null)
        return transformedTree;
      if (label) {
        var states = [];
        for (var i = 0; i < machine.states.length; i++) {
          var state = machine.states[i];
          states.push(state.transformBreakOrContinue(labels));
        }
        machine = new StateMachine(machine.startState, machine.fallThroughState, states, machine.exceptionBlocks);
      }
      return machine;
    },
    transformFunctionBody: function(tree) {
      this.pushTempScope();
      var oldLabels = this.clearLabels_();
      var transformedTree = $__superGet(this, CPSTransformer.prototype, "transformFunctionBody").call(this, tree);
      var machine = this.transformStatementList_(transformedTree.statements);
      this.restoreLabels_(oldLabels);
      this.popTempScope();
      return machine === null ? transformedTree : machine;
    },
    transformStatementList_: function(trees) {
      var groups = [];
      var newMachine;
      for (var i = 0; i < trees.length; i++) {
        if (trees[i].type === STATE_MACHINE) {
          groups.push(trees[i]);
        } else if (needsStateMachine(trees[i])) {
          newMachine = this.ensureTransformed_(trees[i]);
          groups.push(newMachine);
        } else {
          var last = groups[groups.length - 1];
          if (!(last instanceof Array))
            groups.push(last = []);
          last.push(trees[i]);
        }
      }
      if (groups.length === 1 && groups[0] instanceof Array)
        return null;
      var machine = null;
      for (var i$__11 = 0; i$__11 < groups.length; i$__11++) {
        if (groups[i$__11] instanceof Array) {
          newMachine = this.statementsToStateMachine_(groups[i$__11]);
        } else {
          newMachine = groups[i$__11];
        }
        if (i$__11 === 0)
          machine = newMachine;
        else
          machine = machine.append(newMachine);
      }
      return machine;
    },
    needsStateMachine_: function(statements) {
      if (statements instanceof Array) {
        for (var i = 0; i < statements.length; i++) {
          if (needsStateMachine(statements[i]))
            return true;
        }
        return false;
      }
      assert(statements instanceof SwitchStatement);
      return needsStateMachine(statements);
    },
    transformCaseClause: function(tree) {
      var result = $__superGet(this, CPSTransformer.prototype, "transformCaseClause").call(this, tree);
      var machine = this.transformStatementList_(result.statements);
      return machine === null ? result : new CaseClause(null, result.expression, [machine]);
    },
    transformDoWhileStatement: function(tree) {
      var $__8;
      var $__6,
          $__7;
      var labels = this.getLabels_();
      var label = this.clearCurrentLabel_();
      var machine,
          condition,
          body;
      if (this.expressionNeedsStateMachine(tree.condition)) {
        (($__6 = this.expressionToStateMachine(tree.condition), machine = $__6.machine, condition = $__6.expression, $__6));
        body = this.transformAny(tree.body);
      } else {
        var result = $__superGet(this, CPSTransformer.prototype, "transformDoWhileStatement").call(this, tree);
        (($__7 = result, condition = $__7.condition, body = $__7.body, $__7));
        if (body.type !== STATE_MACHINE)
          return result;
      }
      var loopBodyMachine = this.ensureTransformed_(body);
      var startState = loopBodyMachine.startState;
      var conditionState = loopBodyMachine.fallThroughState;
      var fallThroughState = this.allocateState();
      var states = [];
      this.addLoopBodyStates_(loopBodyMachine, conditionState, fallThroughState, labels, states);
      if (machine) {
        machine = machine.replaceStartState(conditionState);
        conditionState = machine.fallThroughState;
        ($__8 = states).push.apply($__8, $__spread(machine.states));
      }
      states.push(new ConditionalState(conditionState, startState, fallThroughState, condition));
      machine = new StateMachine(startState, fallThroughState, states, loopBodyMachine.exceptionBlocks);
      if (label)
        machine = machine.replaceStateId(conditionState, label.continueState);
      return machine;
    },
    addLoopBodyStates_: function(loopBodyMachine, continueState, breakState, labels, states) {
      for (var i = 0; i < loopBodyMachine.states.length; i++) {
        var state = loopBodyMachine.states[i];
        states.push(state.transformBreakOrContinue(labels, breakState, continueState));
      }
    },
    transformForStatement: function(tree) {
      var $__8,
          $__9,
          $__10;
      var labels = this.getLabels_();
      var label = this.clearCurrentLabel_();
      var tmp;
      var initializer = null,
          initializerMachine;
      if (tree.initializer) {
        if (this.expressionNeedsStateMachine(tree.initializer)) {
          tmp = this.expressionToStateMachine(tree.initializer);
          initializer = tmp.expression;
          initializerMachine = tmp.machine;
        } else {
          initializer = this.transformAny(tree.initializer);
        }
      }
      var condition = null,
          conditionMachine;
      if (tree.condition) {
        if (this.expressionNeedsStateMachine(tree.condition)) {
          tmp = this.expressionToStateMachine(tree.condition);
          condition = tmp.expression;
          conditionMachine = tmp.machine;
        } else {
          condition = this.transformAny(tree.condition);
        }
      }
      var increment = null,
          incrementMachine;
      if (tree.increment) {
        if (this.expressionNeedsStateMachine(tree.increment)) {
          tmp = this.expressionToStateMachine(tree.increment);
          increment = tmp.expression;
          incrementMachine = tmp.machine;
        } else {
          increment = this.transformAny(tree.increment);
        }
      }
      var body = this.transformAny(tree.body);
      if (initializer === tree.initializer && condition === tree.condition && increment === tree.increment && body === tree.body) {
        return tree;
      }
      if (!initializerMachine && !conditionMachine && !incrementMachine && body.type !== STATE_MACHINE) {
        return new ForStatement(tree.location, initializer, condition, increment, body);
      }
      var loopBodyMachine = this.ensureTransformed_(body);
      var bodyFallThroughId = loopBodyMachine.fallThroughState;
      var fallThroughId = this.allocateState();
      var startId;
      var initializerStartId = initializer ? this.allocateState() : State.INVALID_STATE;
      var conditionStartId = increment ? this.allocateState() : bodyFallThroughId;
      var loopStartId = loopBodyMachine.startState;
      var incrementStartId = bodyFallThroughId;
      var states = [];
      if (initializer) {
        startId = initializerStartId;
        var initialiserFallThroughId;
        if (condition)
          initialiserFallThroughId = conditionStartId;
        else
          initialiserFallThroughId = loopStartId;
        var tmpId = initializerStartId;
        if (initializerMachine) {
          initializerMachine = initializerMachine.replaceStartState(initializerStartId);
          tmpId = initializerMachine.fallThroughState;
          ($__8 = states).push.apply($__8, $__spread(initializerMachine.states));
        }
        states.push(new FallThroughState(tmpId, initialiserFallThroughId, [createExpressionStatement(initializer)]));
      }
      if (condition) {
        if (!initializer)
          startId = conditionStartId;
        var tmpId$__12 = conditionStartId;
        if (conditionMachine) {
          conditionMachine = conditionMachine.replaceStartState(conditionStartId);
          tmpId$__12 = conditionMachine.fallThroughState;
          ($__9 = states).push.apply($__9, $__spread(conditionMachine.states));
        }
        states.push(new ConditionalState(tmpId$__12, loopStartId, fallThroughId, condition));
      }
      if (increment) {
        var incrementFallThroughId;
        if (condition)
          incrementFallThroughId = conditionStartId;
        else
          incrementFallThroughId = loopStartId;
        var tmpId$__13 = incrementStartId;
        if (incrementMachine) {
          incrementMachine = incrementMachine.replaceStartState(incrementStartId);
          tmpId$__13 = incrementMachine.fallThroughState;
          ($__10 = states).push.apply($__10, $__spread(incrementMachine.states));
        }
        states.push(new FallThroughState(tmpId$__13, incrementFallThroughId, [createExpressionStatement(increment)]));
      }
      if (!initializer && !condition)
        startId = loopStartId;
      var continueId;
      if (increment)
        continueId = incrementStartId;
      else if (condition)
        continueId = conditionStartId;
      else
        continueId = loopStartId;
      if (!increment && !condition) {
        loopBodyMachine = loopBodyMachine.replaceFallThroughState(loopBodyMachine.startState);
      }
      this.addLoopBodyStates_(loopBodyMachine, continueId, fallThroughId, labels, states);
      var machine = new StateMachine(startId, fallThroughId, states, loopBodyMachine.exceptionBlocks);
      if (label)
        machine = machine.replaceStateId(continueId, label.continueState);
      return machine;
    },
    transformForInStatement: function(tree) {
      return tree;
    },
    transformForOfStatement: function(tree) {
      throw new Error('for of statements should be transformed before this pass');
    },
    transformIfStatement: function(tree) {
      var $__8,
          $__9,
          $__10;
      var $__6,
          $__7;
      var machine,
          condition,
          ifClause,
          elseClause;
      if (this.expressionNeedsStateMachine(tree.condition)) {
        (($__6 = this.expressionToStateMachine(tree.condition), machine = $__6.machine, condition = $__6.expression, $__6));
        ifClause = this.transformAny(tree.ifClause);
        elseClause = this.transformAny(tree.elseClause);
      } else {
        var result = $__superGet(this, CPSTransformer.prototype, "transformIfStatement").call(this, tree);
        (($__7 = result, condition = $__7.condition, ifClause = $__7.ifClause, elseClause = $__7.elseClause, $__7));
        if (ifClause.type !== STATE_MACHINE && (elseClause === null || elseClause.type !== STATE_MACHINE)) {
          return result;
        }
      }
      ifClause = this.ensureTransformed_(ifClause);
      elseClause = this.ensureTransformed_(elseClause);
      var startState = this.allocateState();
      var fallThroughState = ifClause.fallThroughState;
      var ifState = ifClause.startState;
      var elseState = elseClause === null ? fallThroughState : elseClause.startState;
      var states = [];
      var exceptionBlocks = [];
      states.push(new ConditionalState(startState, ifState, elseState, condition));
      ($__8 = states).push.apply($__8, $__spread(ifClause.states));
      ($__9 = exceptionBlocks).push.apply($__9, $__spread(ifClause.exceptionBlocks));
      if (elseClause !== null) {
        this.replaceAndAddStates_(elseClause.states, elseClause.fallThroughState, fallThroughState, states);
        ($__10 = exceptionBlocks).push.apply($__10, $__spread(State.replaceAllStates(elseClause.exceptionBlocks, elseClause.fallThroughState, fallThroughState)));
      }
      var ifMachine = new StateMachine(startState, fallThroughState, states, exceptionBlocks);
      if (machine)
        ifMachine = machine.append(ifMachine);
      return ifMachine;
    },
    removeEmptyStates: function(oldStates) {
      var emptyStates = [],
          newStates = [];
      for (var i = 0; i < oldStates.length; i++) {
        if (oldStates[i] instanceof FallThroughState && oldStates[i].statements.length === 0) {
          emptyStates.push(oldStates[i]);
        } else {
          newStates.push(oldStates[i]);
        }
      }
      for (var i$__14 = 0; i$__14 < newStates.length; i$__14++) {
        newStates[i$__14] = emptyStates.reduce(function(state, $__6) {
          var $__7 = $__6,
              id = $__7.id,
              fallThroughState = $__7.fallThroughState;
          return state.replaceState(id, fallThroughState);
        }, newStates[i$__14]);
      }
      return newStates;
    },
    replaceAndAddStates_: function(oldStates, oldState, newState, newStates) {
      for (var i = 0; i < oldStates.length; i++) {
        newStates.push(oldStates[i].replaceState(oldState, newState));
      }
    },
    transformLabelledStatement: function(tree) {
      var startState = this.allocateState();
      var continueState = this.allocateState();
      var fallThroughState = this.allocateState();
      var label = new LabelState(tree.name.value, continueState, fallThroughState);
      var oldLabels = this.addLabel_(label);
      this.currentLabel_ = label;
      var result = this.transformAny(tree.statement);
      if (result === tree.statement) {
        result = tree;
      } else if (result.type === STATE_MACHINE) {
        result = result.replaceStartState(startState);
        result = result.replaceFallThroughState(fallThroughState);
      }
      this.restoreLabels_(oldLabels);
      return result;
    },
    getLabels_: function() {
      return this.labelSet_;
    },
    restoreLabels_: function(oldLabels) {
      this.labelSet_ = oldLabels;
    },
    addLabel_: function(label) {
      var $__5 = this;
      var oldLabels = this.labelSet_;
      var labelSet = new StringMap();
      this.labelSet_.forEach(function(k) {
        return labelSet[k] = $__5.labelSet_[k];
      });
      labelSet.set(label.name, label);
      this.labelSet_ = labelSet;
      return oldLabels;
    },
    clearLabels_: function() {
      var result = this.labelSet_;
      this.labelSet_ = new StringMap();
      return result;
    },
    clearCurrentLabel_: function() {
      var result = this.currentLabel_;
      this.currentLabel_ = null;
      return result;
    },
    transformSwitchStatement: function(tree) {
      var $__6,
          $__7;
      var labels = this.getLabels_();
      var expression,
          machine,
          caseClauses;
      if (this.expressionNeedsStateMachine(tree.expression)) {
        (($__6 = this.expressionToStateMachine(tree.expression), expression = $__6.expression, machine = $__6.machine, $__6));
        caseClauses = this.transformList(tree.caseClauses);
      } else {
        var result = $__superGet(this, CPSTransformer.prototype, "transformSwitchStatement").call(this, tree);
        if (!needsStateMachine(result))
          return result;
        (($__7 = result, expression = $__7.expression, caseClauses = $__7.caseClauses, $__7));
      }
      var startState = this.allocateState();
      var fallThroughState = this.allocateState();
      var nextState = fallThroughState;
      var states = [];
      var clauses = [];
      var tryStates = [];
      var hasDefault = false;
      for (var index = caseClauses.length - 1; index >= 0; index--) {
        var clause = caseClauses[index];
        if (clause.type === CASE_CLAUSE) {
          var caseClause = clause;
          nextState = this.addSwitchClauseStates_(nextState, fallThroughState, labels, caseClause.statements, states, tryStates);
          clauses.push(new SwitchClause(caseClause.expression, nextState));
        } else {
          hasDefault = true;
          var defaultClause = clause;
          nextState = this.addSwitchClauseStates_(nextState, fallThroughState, labels, defaultClause.statements, states, tryStates);
          clauses.push(new SwitchClause(null, nextState));
        }
      }
      if (!hasDefault) {
        clauses.push(new SwitchClause(null, fallThroughState));
      }
      states.push(new SwitchState(startState, expression, clauses.reverse()));
      var switchMachine = new StateMachine(startState, fallThroughState, states.reverse(), tryStates);
      if (machine)
        switchMachine = machine.append(switchMachine);
      return switchMachine;
    },
    addSwitchClauseStates_: function(nextState, fallThroughState, labels, statements, states, tryStates) {
      var $__8;
      var machine = this.ensureTransformedList_(statements);
      for (var i = 0; i < machine.states.length; i++) {
        var state = machine.states[i];
        var transformedState = state.transformBreak(labels, fallThroughState);
        states.push(transformedState.replaceState(machine.fallThroughState, nextState));
      }
      ($__8 = tryStates).push.apply($__8, $__spread(machine.exceptionBlocks));
      return machine.startState;
    },
    transformTryStatement: function(tree) {
      var result = $__superGet(this, CPSTransformer.prototype, "transformTryStatement").call(this, tree);
      var $__6 = result,
          body = $__6.body,
          catchBlock = $__6.catchBlock,
          finallyBlock = $__6.finallyBlock;
      if (body.type !== STATE_MACHINE && (catchBlock === null || catchBlock.catchBody.type !== STATE_MACHINE) && (finallyBlock === null || finallyBlock.block.type !== STATE_MACHINE)) {
        return result;
      }
      var outerCatchState = this.allocateState();
      var outerFinallyState = this.allocateState();
      var pushTryState = this.statementToStateMachine_(parseStatement($__getTemplateObject(["$ctx.pushTry(\n            ", ",\n            ", ");"]), (catchBlock && outerCatchState), (finallyBlock && outerFinallyState)));
      var tryMachine = this.ensureTransformed_(body);
      tryMachine = pushTryState.append(tryMachine);
      if (catchBlock !== null) {
        var popTry = this.statementToStateMachine_(parseStatement($__getTemplateObject(["$ctx.popTry();"])));
        tryMachine = tryMachine.append(popTry);
        var exceptionName = catchBlock.binding.identifierToken.value;
        var catchMachine = this.ensureTransformed_(catchBlock.catchBody);
        var catchStart = this.allocateState();
        this.addMachineVariable(exceptionName);
        var states = $__spread(tryMachine.states, [new FallThroughState(catchStart, catchMachine.startState, parseStatements($__getTemplateObject(["\n              $ctx.popTry();\n              $ctx.maybeUncatchable(); // see RETURN_SENTINEL in runtime\n              ", " = $ctx.storedException;"]), id(exceptionName)))]);
        this.replaceAndAddStates_(catchMachine.states, catchMachine.fallThroughState, tryMachine.fallThroughState, states);
        tryMachine = new StateMachine(tryMachine.startState, tryMachine.fallThroughState, states, [new CatchState(exceptionName, catchStart, tryMachine.fallThroughState, tryMachine.getAllStateIDs(), tryMachine.exceptionBlocks)]);
        tryMachine = tryMachine.replaceStateId(catchStart, outerCatchState);
      }
      if (finallyBlock !== null) {
        var finallyMachine = this.ensureTransformed_(finallyBlock.block);
        var popTry$__15 = this.statementToStateMachine_(parseStatement($__getTemplateObject(["$ctx.popTry();"])));
        finallyMachine = popTry$__15.append(finallyMachine);
        var states$__16 = $__spread(tryMachine.states, finallyMachine.states, [new FinallyFallThroughState(finallyMachine.fallThroughState)]);
        tryMachine = new StateMachine(tryMachine.startState, tryMachine.fallThroughState, states$__16, [new FinallyState(finallyMachine.startState, finallyMachine.fallThroughState, tryMachine.getAllStateIDs(), tryMachine.exceptionBlocks)]);
        tryMachine = tryMachine.replaceStateId(finallyMachine.startState, outerFinallyState);
      }
      return tryMachine;
    },
    transformWhileStatement: function(tree) {
      var $__8;
      var $__6,
          $__7;
      var labels = this.getLabels_();
      var label = this.clearCurrentLabel_();
      var condition,
          machine,
          body;
      if (this.expressionNeedsStateMachine(tree.condition)) {
        (($__6 = this.expressionToStateMachine(tree.condition), machine = $__6.machine, condition = $__6.expression, $__6));
        body = this.transformAny(tree.body);
      } else {
        var result = $__superGet(this, CPSTransformer.prototype, "transformWhileStatement").call(this, tree);
        (($__7 = result, condition = $__7.condition, body = $__7.body, $__7));
        if (body.type !== STATE_MACHINE)
          return result;
      }
      var loopBodyMachine = this.ensureTransformed_(body);
      var startState = loopBodyMachine.fallThroughState;
      var fallThroughState = this.allocateState();
      var states = [];
      var conditionStart = startState;
      if (machine) {
        machine = machine.replaceStartState(startState);
        conditionStart = machine.fallThroughState;
        ($__8 = states).push.apply($__8, $__spread(machine.states));
      }
      states.push(new ConditionalState(conditionStart, loopBodyMachine.startState, fallThroughState, condition));
      this.addLoopBodyStates_(loopBodyMachine, startState, fallThroughState, labels, states);
      machine = new StateMachine(startState, fallThroughState, states, loopBodyMachine.exceptionBlocks);
      if (label)
        machine = machine.replaceStateId(startState, label.continueState);
      return machine;
    },
    transformWithStatement: function(tree) {
      var result = $__superGet(this, CPSTransformer.prototype, "transformWithStatement").call(this, tree);
      if (result.body.type !== STATE_MACHINE) {
        return result;
      }
      throw new Error('Unreachable - with statement not allowed in strict mode/harmony');
    },
    generateMachineInnerFunction: function(machine) {
      var enclosingFinallyState = machine.getEnclosingFinallyMap();
      var SwitchStatement = createSwitchStatement(createMemberExpression('$ctx', 'state'), this.transformMachineStates(machine, State.END_STATE, State.RETHROW_STATE, enclosingFinallyState));
      return parseExpression($__getTemplateObject(["function($ctx) {\n      while (true) ", "\n    }"]), SwitchStatement);
    },
    addTempVar: function() {
      var name = this.getTempIdentifier();
      this.addMachineVariable(name);
      return name;
    },
    addMachineVariable: function(name) {
      this.hoistVariablesTransformer_.addVariable(name);
    },
    transformCpsFunctionBody: function(tree, runtimeMethod) {
      var $__8;
      var functionRef = arguments[2];
      var alphaRenamedTree = AlphaRenamer.rename(tree, 'arguments', '$arguments');
      var hasArguments = alphaRenamedTree !== tree;
      var hoistedTree = this.hoistVariablesTransformer_.transformAny(alphaRenamedTree);
      var maybeMachine = this.transformAny(hoistedTree);
      if (this.reporter.hadError())
        return tree;
      var machine;
      if (maybeMachine.type !== STATE_MACHINE) {
        machine = this.statementsToStateMachine_(maybeMachine.statements);
      } else {
        machine = new StateMachine(maybeMachine.startState, maybeMachine.fallThroughState, this.removeEmptyStates(maybeMachine.states), maybeMachine.exceptionBlocks);
      }
      machine = machine.replaceFallThroughState(State.END_STATE).replaceStartState(State.START_STATE);
      var statements = [];
      if (this.hoistVariablesTransformer_.hasFunctions())
        ($__8 = statements).push.apply($__8, $__spread(this.hoistVariablesTransformer_.getFunctions()));
      if (this.hoistVariablesTransformer_.hasVariables())
        statements.push(this.hoistVariablesTransformer_.getVariableStatement());
      if (hasArguments)
        statements.push(parseStatement($__getTemplateObject(["var $arguments = arguments;"])));
      if (functionRef) {
        statements.push(parseStatement($__getTemplateObject(["return ", "(\n              ", ",\n              ", ", this);"]), runtimeMethod, this.generateMachineInnerFunction(machine), functionRef));
      } else {
        statements.push(parseStatement($__getTemplateObject(["return ", "(\n              ", ", this);"]), runtimeMethod, this.generateMachineInnerFunction(machine)));
      }
      return createFunctionBody(statements);
    },
    transformFunctionDeclaration: function(tree) {
      return tree;
    },
    transformFunctionExpression: function(tree) {
      return tree;
    },
    transformGetAccessor: function(tree) {
      return tree;
    },
    transformSetAccessor: function(tree) {
      return tree;
    },
    transformArrowFunction: function(tree) {
      return tree;
    },
    transformStateMachine: function(tree) {
      return tree;
    },
    statementToStateMachine_: function(statement) {
      var statements;
      if (statement.type === BLOCK)
        statements = statement.statements;
      else
        statements = [statement];
      return this.statementsToStateMachine_(statements);
    },
    statementsToStateMachine_: function(statements) {
      var startState = this.allocateState();
      var fallThroughState = this.allocateState();
      return this.stateToStateMachine_(new FallThroughState(startState, fallThroughState, statements), fallThroughState);
    },
    stateToStateMachine_: function(newState, fallThroughState) {
      return new StateMachine(newState.id, fallThroughState, [newState], []);
    },
    transformMachineStates: function(machine, machineEndState, rethrowState, enclosingFinallyState) {
      var cases = [];
      for (var i = 0; i < machine.states.length; i++) {
        var state = machine.states[i];
        var stateCase = state.transformMachineState(enclosingFinallyState[state.id], machineEndState, this.reporter);
        if (stateCase !== null) {
          cases.push(stateCase);
        }
      }
      this.addFinallyFallThroughDispatches(null, machine.exceptionBlocks, cases);
      cases.push(createDefaultClause(parseStatements($__getTemplateObject(["return $ctx.end()"]))));
      return cases;
    },
    addFinallyFallThroughDispatches: function(enclosingFinallyState, tryStates, cases) {
      for (var i = 0; i < tryStates.length; i++) {
        var tryState = tryStates[i];
        if (tryState.kind === TryState.Kind.FINALLY) {
          var finallyState = tryState;
          if (enclosingFinallyState !== null) {
            var caseClauses = [];
            var index = 0;
            for (var j = 0; j < enclosingFinallyState.tryStates.length; j++) {
              var destination = enclosingFinallyState.tryStates[j];
              index++;
              var statements = void 0;
              if (index < enclosingFinallyState.tryStates.length) {
                statements = [];
              } else {
                statements = parseStatements($__getTemplateObject(["\n                  $ctx.state = $ctx.finallyFallThrough;\n                  $ctx.finallyFallThrough = ", ";\n                  break;"]), State.INVALID_STATE);
              }
              caseClauses.push(createCaseClause(createNumberLiteral(destination), statements));
            }
            caseClauses.push(createDefaultClause([createAssignStateStatement(enclosingFinallyState.finallyState), createBreakStatement()]));
            cases.push(createCaseClause(createNumberLiteral(finallyState.fallThroughState), [createSwitchStatement(createMemberExpression('$ctx', 'finallyFallThrough'), caseClauses), createBreakStatement()]));
          } else {
            cases.push(createCaseClause(createNumberLiteral(finallyState.fallThroughState), parseStatements($__getTemplateObject(["\n                      $ctx.state = $ctx.finallyFallThrough;\n                      break;"]))));
          }
          this.addFinallyFallThroughDispatches(finallyState, finallyState.nestedTrys, cases);
        } else {
          this.addFinallyFallThroughDispatches(enclosingFinallyState, tryState.nestedTrys, cases);
        }
      }
    },
    transformVariableDeclarationList: function(tree) {
      this.reporter.reportError(tree.location, 'Traceur: const/let declarations in a block containing a yield are ' + 'not yet implemented');
      return tree;
    },
    maybeTransformStatement_: function(maybeTransformedStatement) {
      var breakContinueTransformed = new BreakContinueTransformer(this.stateAllocator_).transformAny(maybeTransformedStatement);
      if (breakContinueTransformed !== maybeTransformedStatement) {
        breakContinueTransformed = this.transformAny(breakContinueTransformed);
      }
      return breakContinueTransformed;
    },
    ensureTransformed_: function(statement) {
      if (statement === null) {
        return null;
      }
      var maybeTransformed = this.maybeTransformStatement_(statement);
      return maybeTransformed.type === STATE_MACHINE ? maybeTransformed : this.statementToStateMachine_(maybeTransformed);
    },
    ensureTransformedList_: function(statements) {
      var maybeTransformedStatements = [];
      var foundMachine = false;
      for (var i = 0; i < statements.length; i++) {
        var statement = statements[i];
        var maybeTransformedStatement = this.maybeTransformStatement_(statement);
        maybeTransformedStatements.push(maybeTransformedStatement);
        if (maybeTransformedStatement.type === STATE_MACHINE) {
          foundMachine = true;
        }
      }
      if (!foundMachine) {
        return this.statementsToStateMachine_(statements);
      }
      return this.transformStatementList_(maybeTransformedStatements);
    },
    expressionToStateMachine: function(tree) {
      var commaExpression = new ExplodeExpressionTransformer(this).transformAny(tree);
      var statements = new NormalizeCommaExpressionToStatementTransformer().transformAny(commaExpression).statements;
      var lastStatement = statements.pop();
      assert(lastStatement.type === EXPRESSION_STATEMENT);
      var expression = lastStatement.expression;
      statements = $__superGet(this, CPSTransformer.prototype, "transformList").call(this, statements);
      var machine = this.transformStatementList_(statements);
      return {
        expression: expression,
        machine: machine
      };
    }
  }, {}, $__super);
}(TempVarTransformer);
var NormalizeCommaExpressionToStatementTransformer = function($__super) {
  function NormalizeCommaExpressionToStatementTransformer() {
    $__superConstructor(NormalizeCommaExpressionToStatementTransformer).apply(this, arguments);
  }
  return ($__createClass)(NormalizeCommaExpressionToStatementTransformer, {
    transformCommaExpression: function(tree) {
      var $__5 = this;
      var statements = tree.expressions.map(function(expr) {
        if (expr.type === CONDITIONAL_EXPRESSION)
          return $__5.transformAny(expr);
        return createExpressionStatement(expr);
      });
      return new AnonBlock(tree.location, statements);
    },
    transformConditionalExpression: function(tree) {
      var ifBlock = this.transformAny(tree.left);
      var elseBlock = this.transformAny(tree.right);
      return new IfStatement(tree.location, tree.condition, anonBlockToBlock(ifBlock), anonBlockToBlock(elseBlock));
    }
  }, {}, $__super);
}(ParseTreeTransformer);
function anonBlockToBlock(tree) {
  if (tree.type === PAREN_EXPRESSION)
    return anonBlockToBlock(tree.expression);
  return new Block(tree.location, tree.statements);
}
