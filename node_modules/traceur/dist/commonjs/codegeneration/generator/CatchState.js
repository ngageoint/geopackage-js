"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  CatchState: {
    enumerable: true,
    get: function() {
      return CatchState;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var State = require("./State.js").State;
var TryState = require("./TryState.js").TryState;
var CatchState = function($__super) {
  function CatchState(identifier, catchState, fallThroughState, allStates, nestedTrys) {
    $__superConstructor(CatchState).call(this, TryState.Kind.CATCH, allStates, nestedTrys);
    this.identifier = identifier;
    this.catchState = catchState;
    this.fallThroughState = fallThroughState;
  }
  return ($__createClass)(CatchState, {replaceState: function(oldState, newState) {
      return new CatchState(this.identifier, State.replaceStateId(this.catchState, oldState, newState), State.replaceStateId(this.fallThroughState, oldState, newState), this.replaceAllStates(oldState, newState), this.replaceNestedTrys(oldState, newState));
    }}, {}, $__super);
}(TryState);
