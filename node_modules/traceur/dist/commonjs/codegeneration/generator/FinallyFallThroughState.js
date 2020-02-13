"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FinallyFallThroughState: {
    enumerable: true,
    get: function() {
      return FinallyFallThroughState;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var State = require("./State.js").State;
var FinallyFallThroughState = function($__super) {
  function FinallyFallThroughState() {
    $__superConstructor(FinallyFallThroughState).apply(this, arguments);
  }
  return ($__createClass)(FinallyFallThroughState, {
    replaceState: function(oldState, newState) {
      return new FinallyFallThroughState(State.replaceStateId(this.id, oldState, newState));
    },
    transformMachineState: function(enclosingFinally, machineEndState, reporter) {
      return null;
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      throw new Error('these are generated in addFinallyFallThroughDispatches');
    }
  }, {}, $__super);
}(State);
