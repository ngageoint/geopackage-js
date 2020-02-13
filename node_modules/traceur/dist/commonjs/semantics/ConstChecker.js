"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ConstChecker: {
    enumerable: true,
    get: function() {
      return ConstChecker;
    }
  },
  validate: {
    enumerable: true,
    get: function() {
      return validate;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var IDENTIFIER_EXPRESSION = require("../syntax/trees/ParseTreeType.js").IDENTIFIER_EXPRESSION;
var $__6 = require("../syntax/TokenType.js"),
    CONST = $__6.CONST,
    MINUS_MINUS = $__6.MINUS_MINUS,
    PLUS_PLUS = $__6.PLUS_PLUS;
var ScopeVisitor = require("./ScopeVisitor.js").ScopeVisitor;
var ScopeChainBuilder = require("./ScopeChainBuilder.js").ScopeChainBuilder;
var ConstChecker = function($__super) {
  function ConstChecker(scopeBuilder, reporter) {
    $__superConstructor(ConstChecker).call(this);
    this.scopeBuilder_ = scopeBuilder;
    this.reporter_ = reporter;
  }
  return ($__createClass)(ConstChecker, {
    pushScope: function(tree) {
      return this.scope = this.scopeBuilder_.getScopeForTree(tree);
    },
    visitUnaryExpression: function(tree) {
      if (tree.operand.type === IDENTIFIER_EXPRESSION && (tree.operator.type === PLUS_PLUS || tree.operator.type === MINUS_MINUS)) {
        this.validateMutation_(tree.operand);
      }
      $__superGet(this, ConstChecker.prototype, "visitUnaryExpression").call(this, tree);
    },
    visitPostfixExpression: function(tree) {
      if (tree.operand.type === IDENTIFIER_EXPRESSION) {
        this.validateMutation_(tree.operand);
      }
      $__superGet(this, ConstChecker.prototype, "visitPostfixExpression").call(this, tree);
    },
    visitBinaryExpression: function(tree) {
      if (tree.left.type === IDENTIFIER_EXPRESSION && tree.operator.isAssignmentOperator()) {
        this.validateMutation_(tree.left);
      }
      $__superGet(this, ConstChecker.prototype, "visitBinaryExpression").call(this, tree);
    },
    validateMutation_: function(identifierExpression) {
      if (this.inWithBlock) {
        return;
      }
      var binding = this.scope.getBinding(identifierExpression);
      if (binding === null) {
        return;
      }
      var $__1 = binding,
          type = $__1.type,
          tree = $__1.tree;
      if (type === CONST) {
        this.reportError_(identifierExpression.location, (tree.getStringValue() + " is read-only"));
      }
    },
    reportError_: function(location, message) {
      this.reporter_.reportError(location, message);
    }
  }, {}, $__super);
}(ScopeVisitor);
function validate(tree, reporter) {
  var builder = new ScopeChainBuilder(reporter);
  builder.visitAny(tree);
  var checker = new ConstChecker(builder, reporter);
  checker.visitAny(tree);
}
