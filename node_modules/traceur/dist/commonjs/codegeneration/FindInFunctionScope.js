"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FindInFunctionScope: {
    enumerable: true,
    get: function() {
      return FindInFunctionScope;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var FindVisitor = require("./FindVisitor.js").FindVisitor;
var FindInFunctionScope = function($__super) {
  function FindInFunctionScope() {
    $__superConstructor(FindInFunctionScope).apply(this, arguments);
  }
  return ($__createClass)(FindInFunctionScope, {
    visitFunctionDeclaration: function(tree) {
      this.visitList(tree.annotations);
    },
    visitFunctionExpression: function(tree) {
      this.visitList(tree.annotations);
    },
    visitSetAccessor: function(tree) {
      this.visitAny(tree.name);
      this.visitList(tree.annotations);
    },
    visitGetAccessor: function(tree) {
      this.visitAny(tree.name);
      this.visitList(tree.annotations);
    },
    visitMethod: function(tree) {
      this.visitAny(tree.name);
      this.visitList(tree.annotations);
    }
  }, {}, $__super);
}(FindVisitor);
