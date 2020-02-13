"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ConditionalState: {
    enumerable: true,
    get: function() {
      return ConditionalState;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var State = require("./State.js").State;
var $__5 = require("../ParseTreeFactory.js"),
    createBlock = $__5.createBlock,
    createIfStatement = $__5.createIfStatement;
var parseStatements = require("../PlaceholderParser.js").parseStatements;
var ConditionalState = function($__super) {
  function ConditionalState(id, ifState, elseState, condition) {
    $__superConstructor(ConditionalState).call(this, id);
    this.ifState = ifState;
    this.elseState = elseState;
    this.condition = condition;
  }
  return ($__createClass)(ConditionalState, {
    replaceState: function(oldState, newState) {
      return new ConditionalState(State.replaceStateId(this.id, oldState, newState), State.replaceStateId(this.ifState, oldState, newState), State.replaceStateId(this.elseState, oldState, newState), this.condition);
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      if (State.isFinallyExit(enclosingFinally, this.ifState) || State.isFinallyExit(enclosingFinally, this.elseState)) {
        return [createIfStatement(this.condition, createBlock(State.generateJump(enclosingFinally, this.ifState)), createBlock(State.generateJump(enclosingFinally, this.elseState)))];
      }
      return parseStatements($__getTemplateObject(["$ctx.state = (", ") ? ", " : ", ";\n        break"]), this.condition, this.ifState, this.elseState);
    }
  }, {}, $__super);
}(State);
