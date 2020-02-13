"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  StateMachine: {
    enumerable: true,
    get: function() {
      return StateMachine;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTree = require("./ParseTree.js").ParseTree;
var STATE_MACHINE = require("./ParseTreeType.js").STATE_MACHINE;
var State = require("../../codegeneration/generator/State.js").State;
var TryState = require("../../codegeneration/generator/TryState.js").TryState;
function addCatchOrFinallyStates(kind, enclosingMap, tryStates) {
  for (var i = 0; i < tryStates.length; i++) {
    var tryState = tryStates[i];
    if (tryState.kind === kind) {
      for (var j = 0; j < tryState.tryStates.length; j++) {
        var id = tryState.tryStates[j];
        enclosingMap[id] = tryState;
      }
    }
    addCatchOrFinallyStates(kind, enclosingMap, tryState.nestedTrys);
  }
}
function addAllCatchStates(tryStates, catches) {
  for (var i = 0; i < tryStates.length; i++) {
    var tryState = tryStates[i];
    if (tryState.kind === TryState.Kind.CATCH) {
      catches.push(tryState);
    }
    addAllCatchStates(tryState.nestedTrys, catches);
  }
}
var StateMachine = function($__super) {
  function StateMachine(startState, fallThroughState, states, exceptionBlocks) {
    $__superConstructor(StateMachine).call(this, null);
    this.startState = startState;
    this.fallThroughState = fallThroughState;
    this.states = states;
    this.exceptionBlocks = exceptionBlocks;
  }
  return ($__createClass)(StateMachine, {
    get type() {
      return STATE_MACHINE;
    },
    transform: function(transformer) {
      return transformer.transformStateMachine(this);
    },
    visit: function(visitor) {
      visitor.visitStateMachine(this);
    },
    getAllStateIDs: function() {
      var result = [];
      for (var i = 0; i < this.states.length; i++) {
        result.push(this.states[i].id);
      }
      return result;
    },
    getEnclosingFinallyMap: function() {
      var enclosingMap = Object.create(null);
      addCatchOrFinallyStates(TryState.Kind.FINALLY, enclosingMap, this.exceptionBlocks);
      return enclosingMap;
    },
    allCatchStates: function() {
      var catches = [];
      addAllCatchStates(this.exceptionBlocks, catches);
      return catches;
    },
    replaceStateId: function(oldState, newState) {
      return new StateMachine(State.replaceStateId(this.startState, oldState, newState), State.replaceStateId(this.fallThroughState, oldState, newState), State.replaceAllStates(this.states, oldState, newState), State.replaceAllStates(this.exceptionBlocks, oldState, newState));
    },
    replaceStartState: function(newState) {
      return this.replaceStateId(this.startState, newState);
    },
    replaceFallThroughState: function(newState) {
      return this.replaceStateId(this.fallThroughState, newState);
    },
    append: function(nextMachine) {
      var states = $__spread(this.states);
      for (var i = 0; i < nextMachine.states.length; i++) {
        var otherState = nextMachine.states[i];
        states.push(otherState.replaceState(nextMachine.startState, this.fallThroughState));
      }
      var exceptionBlocks = $__spread(this.exceptionBlocks);
      for (var i$__1 = 0; i$__1 < nextMachine.exceptionBlocks.length; i$__1++) {
        var tryState = nextMachine.exceptionBlocks[i$__1];
        exceptionBlocks.push(tryState.replaceState(nextMachine.startState, this.fallThroughState));
      }
      return new StateMachine(this.startState, nextMachine.fallThroughState, states, exceptionBlocks);
    }
  }, {}, $__super);
}(ParseTree);
