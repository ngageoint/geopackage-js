"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FinallyState: {
    enumerable: true,
    get: function() {
      return FinallyState;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var State = require("./State.js").State;
var TryState = require("./TryState.js").TryState;
var FinallyState = function($__super) {
  function FinallyState(finallyState, fallThroughState, allStates, nestedTrys) {
    $__superConstructor(FinallyState).call(this, TryState.Kind.FINALLY, allStates, nestedTrys);
    this.finallyState = finallyState;
    this.fallThroughState = fallThroughState;
  }
  return ($__createClass)(FinallyState, {replaceState: function(oldState, newState) {
      return new FinallyState(State.replaceStateId(this.finallyState, oldState, newState), State.replaceStateId(this.fallThroughState, oldState, newState), this.replaceAllStates(oldState, newState), this.replaceNestedTrys(oldState, newState));
    }}, {}, $__super);
}(TryState);
