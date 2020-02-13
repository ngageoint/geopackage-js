"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  validateConstructor: {
    enumerable: true,
    get: function() {
      return validateConstructor;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var SUPER_EXPRESSION = require("../syntax/trees/ParseTreeType.js").SUPER_EXPRESSION;
var FindVisitor = require("../codegeneration/FindVisitor.js").FindVisitor;
var ConstructorValidator = function($__super) {
  function ConstructorValidator(reporter) {
    $__superConstructor(ConstructorValidator).call(this);
    this.reporter_ = reporter;
    this.hasError = false;
  }
  return ($__createClass)(ConstructorValidator, {
    visitClassExpression: function(tree) {
      this.visitAny(tree.superClass);
    },
    visitClassDeclaration: function(tree) {
      this.visitAny(tree.superClass);
    },
    visitThisExpression: function(tree) {
      this.reportError_(tree.location, 'this');
    },
    visitCallExpression: function(tree) {
      if (tree.operand.type === SUPER_EXPRESSION) {
        this.visitAny(tree.args);
        this.found = true;
        return;
      }
      $__superGet(this, ConstructorValidator.prototype, "visitCallExpression").call(this, tree);
    },
    visitSuperExpression: function(tree) {
      this.reportError_(tree.location, 'super property');
    },
    reportError_: function(location, kind) {
      this.reporter_.reportError(location, ("'" + kind + "' is not allowed before super()"));
      this.hasError = true;
      this.found = true;
    }
  }, {}, $__super);
}(FindVisitor);
function validateConstructor(tree, reporter) {
  var visitor = new ConstructorValidator(reporter);
  visitor.visitAny(tree);
  if (visitor.hasError)
    return false;
  if (visitor.found)
    return true;
  reporter.reportError(tree.location, 'Derived constructor must call super()');
  return false;
}
