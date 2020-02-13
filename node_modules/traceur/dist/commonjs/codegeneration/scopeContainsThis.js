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
      return $__default;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var FindInFunctionScope = require("./FindInFunctionScope.js").FindInFunctionScope;
var FindThis = function($__super) {
  function FindThis() {
    $__superConstructor(FindThis).apply(this, arguments);
  }
  return ($__createClass)(FindThis, {visitThisExpression: function(tree) {
      this.found = true;
    }}, {}, $__super);
}(FindInFunctionScope);
function scopeContainsThis(tree) {
  var visitor = new FindThis();
  visitor.visitAny(tree);
  return visitor.found;
}
var $__default = scopeContainsThis;
