"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FindThisOrArguments: {
    enumerable: true,
    get: function() {
      return FindThisOrArguments;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ARGUMENTS = require("../syntax/PredefinedName.js").ARGUMENTS;
var FindInFunctionScope = require("./FindInFunctionScope.js").FindInFunctionScope;
var FindThisOrArguments = function($__super) {
  function FindThisOrArguments() {
    $__superConstructor(FindThisOrArguments).call(this);
    this.foundThis = false;
    this.foundArguments = false;
  }
  return ($__createClass)(FindThisOrArguments, {
    visitThisExpression: function(tree) {
      this.foundThis = true;
      this.found = this.foundArguments;
    },
    visitIdentifierExpression: function(tree) {
      if (tree.identifierToken.value === ARGUMENTS) {
        this.foundArguments = true;
        this.found = this.foundThis;
      }
    }
  }, {}, $__super);
}(FindInFunctionScope);
