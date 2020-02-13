"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  validate: {
    enumerable: true,
    get: function() {
      return validate;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ScopeChainBuilderWithReferences = require("./ScopeChainBuilderWithReferences.js").ScopeChainBuilderWithReferences;
var FreeVariableChecker = function($__super) {
  function FreeVariableChecker(reporter, global) {
    $__superConstructor(FreeVariableChecker).call(this, reporter);
    this.global_ = global;
  }
  return ($__createClass)(FreeVariableChecker, {referenceFound: function(tree, name) {
      if (this.scope.getBinding(tree))
        return;
      if (!(name in this.global_)) {
        this.reporter.reportError(tree.location, (name + " is not defined"));
      }
    }}, {}, $__super);
}(ScopeChainBuilderWithReferences);
function validate(tree, reporter) {
  var global = arguments[2] !== (void 0) ? arguments[2] : Reflect.global;
  var checker = new FreeVariableChecker(reporter, global);
  checker.visitAny(tree);
}
