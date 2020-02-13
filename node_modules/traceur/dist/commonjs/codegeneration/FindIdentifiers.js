"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FindIdentifiers: {
    enumerable: true,
    get: function() {
      return FindIdentifiers;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ScopeVisitor = require("../semantics/ScopeVisitor.js").ScopeVisitor;
var FindIdentifiers = function($__super) {
  function FindIdentifiers(tree, filterFunction) {
    $__superConstructor(FindIdentifiers).call(this);
    this.filterFunction_ = filterFunction;
    this.found_ = false;
    this.visitAny(tree);
  }
  return ($__createClass)(FindIdentifiers, {
    visitIdentifierExpression: function(tree) {
      if (this.filterFunction_(tree.identifierToken.value, this.scope.tree)) {
        this.found = true;
      }
    },
    get found() {
      return this.found_;
    },
    set found(v) {
      if (v) {
        this.found_ = true;
      }
    },
    visitAny: function(tree) {
      !this.found_ && tree && tree.visit(this);
    },
    visitList: function(list) {
      if (list) {
        for (var i = 0; !this.found_ && i < list.length; i++) {
          this.visitAny(list[i]);
        }
      }
    }
  }, {}, $__super);
}(ScopeVisitor);
