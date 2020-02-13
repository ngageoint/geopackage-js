"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  TryState: {
    enumerable: true,
    get: function() {
      return TryState;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var State = require("./State.js").State;
var Kind = {
  CATCH: 'catch',
  FINALLY: 'finally'
};
var TryState = function() {
  function TryState(kind, tryStates, nestedTrys) {
    this.kind = kind;
    this.tryStates = tryStates;
    this.nestedTrys = nestedTrys;
  }
  return ($__createClass)(TryState, {
    replaceAllStates: function(oldState, newState) {
      return State.replaceStateList(this.tryStates, oldState, newState);
    },
    replaceNestedTrys: function(oldState, newState) {
      var states = [];
      for (var i = 0; i < this.nestedTrys.length; i++) {
        states.push(this.nestedTrys[i].replaceState(oldState, newState));
      }
      return states;
    }
  }, {});
}();
TryState.Kind = Kind;
