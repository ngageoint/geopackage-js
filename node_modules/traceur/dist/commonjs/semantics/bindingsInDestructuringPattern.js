"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return bindingsInDestructuringPattern;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTreeVisitor = require("../syntax/ParseTreeVisitor.js").ParseTreeVisitor;
var StringSet = require("../util/StringSet.js").StringSet;
var BindingsInDestructuringPatternVisitor = function($__super) {
  function BindingsInDestructuringPatternVisitor() {
    $__superConstructor(BindingsInDestructuringPatternVisitor).call(this);
    this.bindings = new StringSet();
  }
  return ($__createClass)(BindingsInDestructuringPatternVisitor, {
    visitBindingIdentifier: function(tree) {
      this.bindings.add(tree.getStringValue());
    },
    visitBindingElement: function(tree) {
      this.visitAny(tree.binding);
    },
    visitVariableDeclaration: function(tree) {
      this.visitAny(tree.lvalue);
    }
  }, {}, $__super);
}(ParseTreeVisitor);
function bindingsInDestructuringPattern(tree) {
  var v = new BindingsInDestructuringPatternVisitor();
  v.visitAny(tree);
  return v.bindings;
}
