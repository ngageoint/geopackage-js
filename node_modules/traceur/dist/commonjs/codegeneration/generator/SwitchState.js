"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SwitchClause: {
    enumerable: true,
    get: function() {
      return SwitchClause;
    }
  },
  SwitchState: {
    enumerable: true,
    get: function() {
      return SwitchState;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__4 = require("../../syntax/trees/ParseTrees.js"),
    CaseClause = $__4.CaseClause,
    DefaultClause = $__4.DefaultClause,
    SwitchStatement = $__4.SwitchStatement;
var State = require("./State.js").State;
var createBreakStatement = require("../ParseTreeFactory.js").createBreakStatement;
var SwitchClause = function() {
  function SwitchClause(first, second) {
    this.first = first;
    this.second = second;
  }
  return ($__createClass)(SwitchClause, {}, {});
}();
var SwitchState = function($__super) {
  function SwitchState(id, expression, clauses) {
    $__superConstructor(SwitchState).call(this, id);
    this.expression = expression;
    this.clauses = clauses;
  }
  return ($__createClass)(SwitchState, {
    replaceState: function(oldState, newState) {
      var clauses = this.clauses.map(function(clause) {
        return new SwitchClause(clause.first, State.replaceStateId(clause.second, oldState, newState));
      });
      return new SwitchState(State.replaceStateId(this.id, oldState, newState), this.expression, clauses);
    },
    transform: function(enclosingFinally, machineEndState, reporter) {
      var clauses = [];
      for (var i = 0; i < this.clauses.length; i++) {
        var clause = this.clauses[i];
        if (clause.first === null) {
          clauses.push(new DefaultClause(null, State.generateJump(enclosingFinally, clause.second)));
        } else {
          clauses.push(new CaseClause(null, clause.first, State.generateJump(enclosingFinally, clause.second)));
        }
      }
      return [new SwitchStatement(null, this.expression, clauses), createBreakStatement()];
    }
  }, {}, $__super);
}(State);
