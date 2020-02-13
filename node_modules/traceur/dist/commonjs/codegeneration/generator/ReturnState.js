"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ReturnState: {
    enumerable: true,
    get: function() {
      return ReturnState;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__6 = require("../../semantics/util.js"),
    isUndefined = $__6.isUndefined,
    isVoidExpression = $__6.isVoidExpression;
var YieldState = require("./YieldState.js").YieldState;
var State = require("./State.js").State;
var parseStatement = require("../PlaceholderParser.js").parseStatement;
var ReturnState = function($__super) {
  function ReturnState() {
    $__superConstructor(ReturnState).apply(this, arguments);
  }
  return ($__createClass)(ReturnState, {transform: function(enclosingFinally, machineEndState, reporter) {
      var $__1;
      var e = this.expression;
      var statements = [];
      if (e && !isUndefined(e) && !isVoidExpression(e))
        statements.push(parseStatement($__getTemplateObject(["$ctx.returnValue = ", ""]), this.expression));
      ($__1 = statements).push.apply($__1, $__spread(State.generateJump(enclosingFinally, machineEndState)));
      return statements;
    }}, {}, $__super);
}(YieldState);
