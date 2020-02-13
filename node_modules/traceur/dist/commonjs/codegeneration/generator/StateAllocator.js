"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  StateAllocator: {
    enumerable: true,
    get: function() {
      return StateAllocator;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var State = require("./State.js").State;
var StateAllocator = function() {
  function StateAllocator() {
    this.nextState_ = State.START_STATE + 1;
  }
  return ($__createClass)(StateAllocator, {allocateState: function() {
      return this.nextState_++;
    }}, {});
}();
