"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  Scope: {
    enumerable: true,
    get: function() {
      return Scope;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__3 = require("../syntax/trees/ParseTreeType.js"),
    BLOCK = $__3.BLOCK,
    CATCH = $__3.CATCH,
    FUNCTION_EXPRESSION = $__3.FUNCTION_EXPRESSION;
var StringMap = require("../util/StringMap.js").StringMap;
var VAR = require("../syntax/TokenType.js").VAR;
var isTreeStrict = require("./isTreeStrict.js").isTreeStrict;
function reportDuplicateVar(reporter, tree, name) {
  reporter.reportError(tree.location, ("Duplicate declaration, " + name));
}
var Scope = function() {
  function Scope(parent, tree) {
    this.parent = parent;
    this.tree = tree;
    this.variableDeclarations_ = new StringMap();
    this.lexicalDeclarations_ = new StringMap();
    this.strictMode = parent && parent.strictMode || isTreeStrict(tree);
    this.inGenerator = parent ? parent.inGenerator || false : false;
  }
  return ($__createClass)(Scope, {
    addBinding: function(tree, type, reporter) {
      if (type === VAR) {
        this.addVar(tree, reporter);
      } else {
        this.addDeclaration(tree, type, reporter);
      }
    },
    addVar: function(tree, reporter) {
      var name = tree.getStringValue();
      if (this.lexicalDeclarations_.has(name) && !this.isFunctionExpressionName(name)) {
        reportDuplicateVar(reporter, tree, name);
        return;
      }
      this.variableDeclarations_.set(name, {
        type: VAR,
        tree: tree,
        scope: this
      });
      if (!this.isVarScope && this.parent) {
        this.parent.addVar(tree, reporter);
      }
    },
    addDeclaration: function(tree, type, reporter) {
      var name = tree.getStringValue();
      if ((this.lexicalDeclarations_.has(name) || this.variableDeclarations_.has(name)) && !this.isFunctionExpressionName(name)) {
        reportDuplicateVar(reporter, tree, name);
        return;
      }
      this.lexicalDeclarations_.set(name, {
        type: type,
        tree: tree,
        scope: this
      });
    },
    renameBinding: function(oldName, newTree, newType, reporter) {
      var name = newTree.getStringValue();
      if (newType === VAR) {
        if (this.lexicalDeclarations_.has(oldName)) {
          this.lexicalDeclarations_.delete(oldName);
          this.addVar(newTree, reporter);
        }
      } else if (this.variableDeclarations_.has(oldName)) {
        this.variableDeclarations_.delete(oldName);
        this.addDeclaration(newTree, newType, reporter);
        if (!this.isVarScope && this.parent) {
          this.parent.renameBinding(oldName, newTree, newType);
        }
      }
    },
    get isVarScope() {
      switch (this.tree.type) {
        case BLOCK:
        case CATCH:
          return false;
      }
      return true;
    },
    getVarScope: function() {
      if (this.isVarScope) {
        return this;
      }
      if (this.parent) {
        return this.parent.getVarScope();
      }
      return null;
    },
    isFunctionExpressionName: function(name) {
      var b = this.getBindingByName(name);
      return b && b.scope.tree.type === FUNCTION_EXPRESSION && b.scope.tree.name === b.tree;
    },
    getBinding: function(tree) {
      var name = tree.getStringValue();
      return this.getBindingByName(name);
    },
    getBindingByName: function(name) {
      var b = this.variableDeclarations_.get(name);
      if (b && this.isVarScope) {
        return b;
      }
      b = this.lexicalDeclarations_.get(name);
      if (b) {
        return b;
      }
      if (this.parent) {
        return this.parent.getBindingByName(name);
      }
      return null;
    },
    getAllBindingNames: function() {
      var names = this.variableDeclarations_.keysAsSet();
      this.lexicalDeclarations_.forEach(function(name) {
        return names.add(name);
      });
      return names;
    },
    getVariableBindingNames: function() {
      return this.variableDeclarations_.keysAsSet();
    },
    getLexicalBindingNames: function() {
      return this.lexicalDeclarations_.keysAsSet();
    },
    hasBindingName: function(name) {
      return this.lexicalDeclarations_.has(name) || this.variableDeclarations_.has(name);
    },
    hasLexicalBindingName: function(name) {
      return this.lexicalDeclarations_.has(name);
    },
    hasVariableBindingName: function(name) {
      return this.variableDeclarations_.has(name);
    }
  }, {});
}();
