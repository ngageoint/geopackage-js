"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  PropertyNameShorthandTransformer: {
    enumerable: true,
    get: function() {
      return PropertyNameShorthandTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__3 = require("../syntax/trees/ParseTrees.js"),
    IdentifierExpression = $__3.IdentifierExpression,
    LiteralPropertyName = $__3.LiteralPropertyName,
    PropertyNameAssignment = $__3.PropertyNameAssignment;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var PropertyNameShorthandTransformer = function($__super) {
  function PropertyNameShorthandTransformer() {
    $__superConstructor(PropertyNameShorthandTransformer).apply(this, arguments);
  }
  return ($__createClass)(PropertyNameShorthandTransformer, {transformPropertyNameShorthand: function(tree) {
      return new PropertyNameAssignment(tree.location, new LiteralPropertyName(tree.location, tree.name), new IdentifierExpression(tree.location, tree.name));
    }}, {}, $__super);
}(ParseTreeTransformer);
