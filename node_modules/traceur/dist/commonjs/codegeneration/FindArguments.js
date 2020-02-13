"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return FindArguments;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ARGUMENTS = require("../syntax/PredefinedName.js").ARGUMENTS;
var FindInFunctionScope = require("./FindInFunctionScope.js").FindInFunctionScope;
var FindArguments = function($__super) {
  function FindArguments() {
    $__superConstructor(FindArguments).apply(this, arguments);
  }
  return ($__createClass)(FindArguments, {visitIdentifierExpression: function(tree) {
      if (tree.identifierToken.value === ARGUMENTS) {
        this.found = true;
      }
    }}, {}, $__super);
}(FindInFunctionScope);
