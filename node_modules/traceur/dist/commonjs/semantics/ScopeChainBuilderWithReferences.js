"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ScopeChainBuilderWithReferences: {
    enumerable: true,
    get: function() {
      return ScopeChainBuilderWithReferences;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var ScopeChainBuilder = require("./ScopeChainBuilder.js").ScopeChainBuilder;
var ScopeReferences = require("./ScopeReferences.js").ScopeReferences;
var $__6 = require("../syntax/trees/ParseTreeType.js"),
    FUNCTION_DECLARATION = $__6.FUNCTION_DECLARATION,
    FUNCTION_EXPRESSION = $__6.FUNCTION_EXPRESSION,
    GET_ACCESSOR = $__6.GET_ACCESSOR,
    IDENTIFIER_EXPRESSION = $__6.IDENTIFIER_EXPRESSION,
    METHOD = $__6.METHOD,
    MODULE = $__6.MODULE,
    SET_ACCESSOR = $__6.SET_ACCESSOR;
var TYPEOF = require("../syntax/TokenType.js").TYPEOF;
function hasArgumentsInScope(scope) {
  for (; scope; scope = scope.parent) {
    switch (scope.tree.type) {
      case FUNCTION_DECLARATION:
      case FUNCTION_EXPRESSION:
      case GET_ACCESSOR:
      case METHOD:
      case SET_ACCESSOR:
        return true;
    }
  }
  return false;
}
function inModuleScope(scope) {
  for (; scope; scope = scope.parent) {
    if (scope.tree.type === MODULE) {
      return true;
    }
  }
  return false;
}
var ScopeChainBuilderWithReferences = function($__super) {
  function ScopeChainBuilderWithReferences() {
    $__superConstructor(ScopeChainBuilderWithReferences).apply(this, arguments);
  }
  return ($__createClass)(ScopeChainBuilderWithReferences, {
    createScope: function(tree) {
      return new ScopeReferences(this.scope, tree);
    },
    visitIdentifierExpression: function(tree) {
      if (this.inWithBlock) {
        return;
      }
      var scope = this.scope;
      var name = tree.getStringValue();
      if (name === 'arguments' && hasArgumentsInScope(scope)) {
        return;
      }
      if (name === '__moduleName' && inModuleScope(scope)) {
        return;
      }
      this.referenceFound(tree, name);
    },
    visitUnaryExpression: function(tree) {
      if (tree.operator.type === TYPEOF && tree.operand.type === IDENTIFIER_EXPRESSION) {
        var scope = this.scope;
        var binding = scope.getBinding(tree.operand);
        if (!binding) {
          scope.addVar(tree.operand, this.reporter);
        }
      } else {
        $__superGet(this, ScopeChainBuilderWithReferences.prototype, "visitUnaryExpression").call(this, tree);
      }
    },
    referenceFound: function(tree, name) {
      this.scope.addReference(name);
    }
  }, {}, $__super);
}(ScopeChainBuilder);
