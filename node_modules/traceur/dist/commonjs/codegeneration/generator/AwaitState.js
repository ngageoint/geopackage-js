"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AwaitState: {
    enumerable: true,
    get: function() {
      return AwaitState;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var State = require("./State.js").State;
var parseStatements = require("../PlaceholderParser.js").parseStatements;
var AwaitState = function($__super) {
  function AwaitState(id, callbackState, expression) {
    $__superConstructor(AwaitState).call(this, id), this.callbackState = callbackState;
    this.expression = expression;
  }
  return ($__createClass)(AwaitState, {
    replaceState: function(oldState, newState) {
      return new AwaitState(State.replaceStateId(this.id, oldState, newState), State.replaceStateId(this.callbackState, oldState, newState), this.expression);
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      var $__1;
      var stateId,
          statements;
      if (State.isFinallyExit(enclosingFinally, this.callbackState)) {
        stateId = enclosingFinally.finallyState;
        statements = parseStatements($__getTemplateObject(["$ctx.finallyFallThrough = ", ""]), this.callbackState);
      } else {
        stateId = this.callbackState;
        statements = [];
      }
      ($__1 = statements).push.apply($__1, $__spread(parseStatements($__getTemplateObject(["Promise.resolve(", ").then(\n          $ctx.createCallback(", "), $ctx.errback);\n          return;"]), this.expression, stateId)));
      return statements;
    }
  }, {}, $__super);
}(State);
