"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  EndState: {
    enumerable: true,
    get: function() {
      return EndState;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var State = require("./State.js").State;
var EndState = function($__super) {
  function EndState() {
    $__superConstructor(EndState).apply(this, arguments);
  }
  return ($__createClass)(EndState, {
    replaceState: function(oldState, newState) {
      return new EndState(State.replaceStateId(this.id, oldState, newState));
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      return State.generateJump(enclosingFinally, machineEndState);
    }
  }, {}, $__super);
}(State);
