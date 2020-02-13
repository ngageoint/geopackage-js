"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  BreakContinueTransformer: {
    enumerable: true,
    get: function() {
      return BreakContinueTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var BreakState = require("./BreakState.js").BreakState;
var ContinueState = require("./ContinueState.js").ContinueState;
var ParseTreeTransformer = require("../ParseTreeTransformer.js").ParseTreeTransformer;
var StateMachine = require("../../syntax/trees/StateMachine.js").StateMachine;
function safeGetLabel(tree) {
  return tree.name ? tree.name.value : null;
}
var BreakContinueTransformer = function($__super) {
  function BreakContinueTransformer(stateAllocator) {
    $__superConstructor(BreakContinueTransformer).call(this);
    this.transformBreaks_ = true;
    this.stateAllocator_ = stateAllocator;
  }
  return ($__createClass)(BreakContinueTransformer, {
    allocateState_: function() {
      return this.stateAllocator_.allocateState();
    },
    stateToStateMachine_: function(newState) {
      var fallThroughState = this.allocateState_();
      return new StateMachine(newState.id, fallThroughState, [newState], []);
    },
    transformBreakStatement: function(tree) {
      return this.transformBreaks_ || tree.name ? this.stateToStateMachine_(new BreakState(this.allocateState_(), safeGetLabel(tree))) : tree;
    },
    transformContinueStatement: function(tree) {
      return this.stateToStateMachine_(new ContinueState(this.allocateState_(), safeGetLabel(tree)));
    },
    transformDoWhileStatement: function(tree) {
      return tree;
    },
    transformForOfStatement: function(tree) {
      return tree;
    },
    transformForOnStatement: function(tree) {
      return tree;
    },
    transformForStatement: function(tree) {
      return tree;
    },
    transformFunctionDeclaration: function(tree) {
      return tree;
    },
    transformFunctionExpression: function(tree) {
      return tree;
    },
    transformStateMachine: function(tree) {
      return tree;
    },
    transformSwitchStatement: function(tree) {
      var oldState = this.transformBreaks_;
      this.transformBreaks_ = false;
      var result = $__superGet(this, BreakContinueTransformer.prototype, "transformSwitchStatement").call(this, tree);
      this.transformBreaks_ = oldState;
      return result;
    },
    transformWhileStatement: function(tree) {
      return tree;
    }
  }, {}, $__super);
}(ParseTreeTransformer);
