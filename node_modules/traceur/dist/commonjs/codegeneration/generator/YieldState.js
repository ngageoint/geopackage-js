"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  YieldState: {
    enumerable: true,
    get: function() {
      return YieldState;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var State = require("./State.js").State;
var createReturnStatement = require("../ParseTreeFactory.js").createReturnStatement;
var YieldState = function($__super) {
  function YieldState(id, fallThroughState, expression) {
    $__superConstructor(YieldState).call(this, id);
    this.fallThroughState = fallThroughState;
    this.expression = expression;
  }
  return ($__createClass)(YieldState, {
    replaceState: function(oldState, newState) {
      return new this.constructor(State.replaceStateId(this.id, oldState, newState), State.replaceStateId(this.fallThroughState, oldState, newState), this.expression);
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      return $__spread(State.generateAssignState(enclosingFinally, this.fallThroughState), [createReturnStatement(this.expression)]);
    }
  }, {}, $__super);
}(State);
