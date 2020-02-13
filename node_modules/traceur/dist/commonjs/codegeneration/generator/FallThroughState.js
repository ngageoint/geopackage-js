"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FallThroughState: {
    enumerable: true,
    get: function() {
      return FallThroughState;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var State = require("./State.js").State;
var FallThroughState = function($__super) {
  function FallThroughState(id, fallThroughState, statements) {
    $__superConstructor(FallThroughState).call(this, id);
    this.fallThroughState = fallThroughState;
    this.statements = statements;
  }
  return ($__createClass)(FallThroughState, {
    replaceState: function(oldState, newState) {
      return new FallThroughState(State.replaceStateId(this.id, oldState, newState), State.replaceStateId(this.fallThroughState, oldState, newState), this.statements);
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      return $__spread(this.statements, State.generateJump(enclosingFinally, this.fallThroughState));
    }
  }, {}, $__super);
}(State);
