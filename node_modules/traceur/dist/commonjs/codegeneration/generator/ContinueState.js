"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ContinueState: {
    enumerable: true,
    get: function() {
      return ContinueState;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var FallThroughState = require("./FallThroughState.js").FallThroughState;
var State = require("./State.js").State;
var ContinueState = function($__super) {
  function ContinueState(id, label) {
    $__superConstructor(ContinueState).call(this, id);
    this.label = label;
  }
  return ($__createClass)(ContinueState, {
    replaceState: function(oldState, newState) {
      return new ContinueState(State.replaceStateId(this.id, oldState, newState), this.label);
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      throw new Error('These should be removed before the transform step');
    },
    transformBreakOrContinue: function(labelSet) {
      var breakState = arguments[1];
      var continueState = arguments[2];
      if (this.label === null)
        return new FallThroughState(this.id, continueState, []);
      if (labelSet.has(this.label)) {
        return new FallThroughState(this.id, labelSet.get(this.label).continueState, []);
      }
      return this;
    }
  }, {}, $__super);
}(State);
