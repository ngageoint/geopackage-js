"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ScopeChainBuilder: {
    enumerable: true,
    get: function() {
      return ScopeChainBuilder;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__4 = require("../syntax/TokenType.js"),
    CONST = $__4.CONST,
    LET = $__4.LET,
    VAR = $__4.VAR;
var ScopeVisitor = require("./ScopeVisitor.js").ScopeVisitor;
var ScopeChainBuilder = function($__super) {
  function ScopeChainBuilder(reporter) {
    $__superConstructor(ScopeChainBuilder).call(this);
    this.reporter = reporter;
    this.declarationType_ = null;
  }
  return ($__createClass)(ScopeChainBuilder, {
    visitCatch: function(tree) {
      var scope = this.pushScope(tree);
      this.declarationType_ = LET;
      this.visitAny(tree.binding);
      this.visitList(tree.catchBody.statements);
      this.popScope(scope);
    },
    visitImportedBinding: function(tree) {
      this.declarationType_ = CONST;
      $__superGet(this, ScopeChainBuilder.prototype, "visitImportedBinding").call(this, tree);
    },
    visitVariableDeclarationList: function(tree) {
      this.declarationType_ = tree.declarationType;
      $__superGet(this, ScopeChainBuilder.prototype, "visitVariableDeclarationList").call(this, tree);
    },
    visitBindingIdentifier: function(tree) {
      this.declareVariable(tree);
    },
    visitFunctionExpression: function(tree) {
      var scope = this.pushScope(tree);
      if (tree.name) {
        this.declarationType_ = CONST;
        this.visitAny(tree.name);
      }
      this.visitAny(tree.parameterList);
      scope.inGenerator = tree.isGenerator();
      this.visitAny(tree.body);
      this.popScope(scope);
    },
    visitFormalParameter: function(tree) {
      this.declarationType_ = VAR;
      $__superGet(this, ScopeChainBuilder.prototype, "visitFormalParameter").call(this, tree);
    },
    visitFunctionDeclaration: function(tree) {
      if (this.scope) {
        if (this.scope.isVarScope) {
          this.declarationType_ = VAR;
          this.visitAny(tree.name);
        } else {
          if (!this.scope.strictMode) {
            var varScope = this.scope.getVarScope();
            if (varScope) {
              varScope.addVar(tree.name, this.reporter);
            }
          }
          this.declarationType_ = LET;
          this.visitAny(tree.name);
        }
      }
      this.visitFunctionBodyForScope(tree, tree.parameterList, tree.body);
    },
    visitClassDeclaration: function(tree) {
      this.visitAny(tree.superClass);
      this.declarationType_ = LET;
      this.visitAny(tree.name);
      var scope = this.pushScope(tree);
      this.declarationType_ = CONST;
      this.visitAny(tree.name);
      this.visitList(tree.elements);
      this.popScope(scope);
    },
    visitClassExpression: function(tree) {
      this.visitAny(tree.superClass);
      var scope;
      if (tree.name) {
        scope = this.pushScope(tree);
        this.declarationType_ = CONST;
        this.visitAny(tree.name);
      }
      this.visitList(tree.elements);
      if (tree.name) {
        this.popScope(scope);
      }
    },
    visitComprehensionFor: function(tree) {
      this.declarationType_ = LET;
      $__superGet(this, ScopeChainBuilder.prototype, "visitComprehensionFor").call(this, tree);
    },
    declareVariable: function(tree) {
      this.scope.addBinding(tree, this.declarationType_, this.reporter);
    }
  }, {}, $__super);
}(ScopeVisitor);
