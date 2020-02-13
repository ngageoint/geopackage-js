"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  State: {
    enumerable: true,
    get: function() {
      return State;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__4 = require("../ParseTreeFactory.js"),
    createAssignStateStatement = $__4.createAssignStateStatement,
    createBreakStatement = $__4.createBreakStatement,
    createCaseClause = $__4.createCaseClause,
    createNumberLiteral = $__4.createNumberLiteral;
var parseStatement = require("../PlaceholderParser.js").parseStatement;
var State = function() {
  function State(id) {
    this.id = id;
  }
  return ($__createClass)(State, {
    transformMachineState: function(enclosingFinally, machineEndState, reporter) {
      return createCaseClause(createNumberLiteral(this.id), this.transform(enclosingFinally, machineEndState, reporter));
    },
    transformBreak: function(labelSet, breakState) {
      return this;
    },
    transformBreakOrContinue: function(labelSet) {
      var breakState = arguments[1];
      var continueState = arguments[2];
      return this;
    }
  }, {});
}();
State.START_STATE = 0;
State.INVALID_STATE = -1;
State.END_STATE = -2;
State.RETHROW_STATE = -3;
State.generateJump = function(enclosingFinally, fallThroughState) {
  return $__spread(State.generateAssignState(enclosingFinally, fallThroughState), [createBreakStatement()]);
};
State.generateAssignState = function(enclosingFinally, fallThroughState) {
  var assignState;
  if (State.isFinallyExit(enclosingFinally, fallThroughState)) {
    assignState = generateAssignStateOutOfFinally(enclosingFinally, fallThroughState);
  } else {
    assignState = [createAssignStateStatement(fallThroughState)];
  }
  return assignState;
};
State.isFinallyExit = function(enclosingFinally, destination) {
  return !!enclosingFinally && enclosingFinally.tryStates.indexOf(destination) < 0;
};
function generateAssignStateOutOfFinally(enclosingFinally, destination) {
  var finallyState = enclosingFinally.finallyState;
  return [createAssignStateStatement(finallyState), parseStatement($__getTemplateObject(["$ctx.finallyFallThrough = ", ""]), destination)];
}
State.replaceStateList = function(oldStates, oldState, newState) {
  var states = [];
  for (var i = 0; i < oldStates.length; i++) {
    states.push(State.replaceStateId(oldStates[i], oldState, newState));
  }
  return states;
};
State.replaceStateId = function(current, oldState, newState) {
  return current === oldState ? newState : current;
};
State.replaceAllStates = function(exceptionBlocks, oldState, newState) {
  var result = [];
  for (var i = 0; i < exceptionBlocks.length; i++) {
    result.push(exceptionBlocks[i].replaceState(oldState, newState));
  }
  return result;
};
