"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ScopeVisitor: {
    enumerable: true,
    get: function() {
      return ScopeVisitor;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var ParseTreeVisitor = require("../syntax/ParseTreeVisitor.js").ParseTreeVisitor;
var VAR = require("../syntax/TokenType.js").VAR;
var Scope = require("./Scope.js").Scope;
var $__9 = require("../syntax/trees/ParseTreeType.js"),
    COMPREHENSION_FOR = $__9.COMPREHENSION_FOR,
    VARIABLE_DECLARATION_LIST = $__9.VARIABLE_DECLARATION_LIST;
var ScopeVisitor = function($__super) {
  function ScopeVisitor() {
    $__superConstructor(ScopeVisitor).call(this);
    this.map_ = new Map();
    this.scope = null;
    this.withBlockCounter_ = 0;
  }
  return ($__createClass)(ScopeVisitor, {
    getScopeForTree: function(tree) {
      return this.map_.get(tree);
    },
    createScope: function(tree) {
      return new Scope(this.scope, tree);
    },
    pushScope: function(tree) {
      var scope = this.createScope(tree);
      this.map_.set(tree, scope);
      return this.scope = scope;
    },
    popScope: function(scope) {
      if (this.scope !== scope) {
        throw new Error('ScopeVisitor scope mismatch');
      }
      this.scope = scope.parent;
    },
    visitScript: function(tree) {
      var scope = this.pushScope(tree);
      $__superGet(this, ScopeVisitor.prototype, "visitScript").call(this, tree);
      this.popScope(scope);
    },
    visitModule: function(tree) {
      var scope = this.pushScope(tree);
      $__superGet(this, ScopeVisitor.prototype, "visitModule").call(this, tree);
      this.popScope(scope);
    },
    visitBlock: function(tree) {
      var scope = this.pushScope(tree);
      $__superGet(this, ScopeVisitor.prototype, "visitBlock").call(this, tree);
      this.popScope(scope);
    },
    visitCatch: function(tree) {
      var scope = this.pushScope(tree);
      this.visitAny(tree.binding);
      this.visitList(tree.catchBody.statements);
      this.popScope(scope);
    },
    visitFunctionBodyForScope: function(tree) {
      var parameterList = arguments[1] !== (void 0) ? arguments[1] : tree.parameterList;
      var scope = this.pushScope(tree);
      this.visitAny(parameterList);
      scope.inGenerator = tree.functionKind && tree.isGenerator();
      this.visitAny(tree.body);
      this.popScope(scope);
    },
    visitFunctionExpression: function(tree) {
      this.visitFunctionBodyForScope(tree);
    },
    visitFunctionDeclaration: function(tree) {
      this.visitAny(tree.name);
      this.visitFunctionBodyForScope(tree);
    },
    visitArrowFunction: function(tree) {
      this.visitFunctionBodyForScope(tree);
    },
    visitGetAccessor: function(tree) {
      this.visitFunctionBodyForScope(tree, null);
    },
    visitSetAccessor: function(tree) {
      this.visitFunctionBodyForScope(tree);
    },
    visitMethod: function(tree) {
      this.visitFunctionBodyForScope(tree);
    },
    visitClassDeclaration: function(tree) {
      this.visitAny(tree.superClass);
      var scope = this.pushScope(tree);
      this.visitAny(tree.name);
      this.visitList(tree.elements);
      this.popScope(scope);
    },
    visitClassExpression: function(tree) {
      this.visitAny(tree.superClass);
      var scope;
      if (tree.name) {
        scope = this.pushScope(tree);
        this.visitAny(tree.name);
      }
      this.visitList(tree.elements);
      if (tree.name) {
        this.popScope(scope);
      }
    },
    visitWithStatement: function(tree) {
      this.visitAny(tree.expression);
      this.withBlockCounter_++;
      this.visitAny(tree.body);
      this.withBlockCounter_--;
    },
    get inWithBlock() {
      return this.withBlockCounter_ > 0;
    },
    visitLoop_: function(tree, func) {
      if (tree.initializer.type !== VARIABLE_DECLARATION_LIST || tree.initializer.declarationType === VAR) {
        func();
        return;
      }
      var scope = this.pushScope(tree);
      func();
      this.popScope(scope);
    },
    visitForInStatement: function(tree) {
      var $__1 = this;
      this.visitLoop_(tree, function() {
        return $__superGet($__1, ScopeVisitor.prototype, "visitForInStatement").call($__1, tree);
      });
    },
    visitForOfStatement: function(tree) {
      var $__1 = this;
      this.visitLoop_(tree, function() {
        return $__superGet($__1, ScopeVisitor.prototype, "visitForOfStatement").call($__1, tree);
      });
    },
    visitForStatement: function(tree) {
      var $__1 = this;
      if (!tree.initializer) {
        $__superGet(this, ScopeVisitor.prototype, "visitForStatement").call(this, tree);
      } else {
        this.visitLoop_(tree, function() {
          return $__superGet($__1, ScopeVisitor.prototype, "visitForStatement").call($__1, tree);
        });
      }
    },
    visitComprehension_: function(tree) {
      var scopes = [];
      for (var i = 0; i < tree.comprehensionList.length; i++) {
        var scope = null;
        if (tree.comprehensionList[i].type === COMPREHENSION_FOR) {
          scope = this.pushScope(tree.comprehensionList[i]);
        }
        scopes.push(scope);
        this.visitAny(tree.comprehensionList[i]);
      }
      this.visitAny(tree.expression);
      for (var i$__2 = scopes.length - 1; i$__2 >= 0; i$__2--) {
        if (scopes[i$__2]) {
          this.popScope(scopes[i$__2]);
        }
      }
    },
    visitArrayComprehension: function(tree) {
      this.visitComprehension_(tree);
    },
    visitGeneratorComprehension: function(tree) {
      this.visitComprehension_(tree);
    },
    visitPredefinedType: function(tree) {},
    visitTypeArguments: function(tree) {},
    visitFunctionType: function(tree) {}
  }, {}, $__super);
}(ParseTreeVisitor);
