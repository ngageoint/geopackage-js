"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  BreakState: {
    enumerable: true,
    get: function() {
      return BreakState;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var FallThroughState = require("./FallThroughState.js").FallThroughState;
var State = require("./State.js").State;
var BreakState = function($__super) {
  function BreakState(id, label) {
    $__superConstructor(BreakState).call(this, id);
    this.label = label;
  }
  return ($__createClass)(BreakState, {
    replaceState: function(oldState, newState) {
      return new BreakState(State.replaceStateId(this.id, oldState, newState), this.label);
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      throw new Error('These should be removed before the transform step');
    },
    transformBreak: function(labelSet) {
      var breakState = arguments[1];
      if (this.label === null)
        return new FallThroughState(this.id, breakState, []);
      if (labelSet.has(this.label)) {
        return new FallThroughState(this.id, labelSet.get(this.label).fallThroughState, []);
      }
      return this;
    },
    transformBreakOrContinue: function(labelSet) {
      var breakState = arguments[1];
      var continueState = arguments[2];
      return this.transformBreak(labelSet, breakState);
    }
  }, {}, $__super);
}(State);
