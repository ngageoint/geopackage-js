"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ScopeReferences: {
    enumerable: true,
    get: function() {
      return ScopeReferences;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var Scope = require("./Scope.js").Scope;
var StringSet = require("../util/StringSet.js").StringSet;
var ScopeReferences = function($__super) {
  function ScopeReferences(parent, tree) {
    $__superConstructor(ScopeReferences).call(this, parent, tree);
    this.freeVars_ = new StringSet();
  }
  return ($__createClass)(ScopeReferences, {
    addReference: function(name) {
      this.freeVars_.add(name);
    },
    hasFreeVariable: function(name) {
      return this.freeVars_.has(name);
    }
  }, {}, $__super);
}(Scope);
