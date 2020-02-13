"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  TypeToExpressionTransformer: {
    enumerable: true,
    get: function() {
      return TypeToExpressionTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__6 = require("../syntax/trees/ParseTrees.js"),
    ArgumentList = $__6.ArgumentList,
    IdentifierExpression = $__6.IdentifierExpression,
    MemberExpression = $__6.MemberExpression;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var TypeToExpressionTransformer = function($__super) {
  function TypeToExpressionTransformer() {
    $__superConstructor(TypeToExpressionTransformer).apply(this, arguments);
  }
  return ($__createClass)(TypeToExpressionTransformer, {
    transformTypeName: function(tree) {
      if (tree.moduleName) {
        var operand = this.transformAny(tree.moduleName);
        return new MemberExpression(tree.location, operand, tree.name);
      }
      return new IdentifierExpression(tree.location, tree.name);
    },
    transformPredefinedType: function(tree) {
      return parseExpression($__getTemplateObject(["$traceurRuntime.type.", ")"]), tree.typeToken);
    },
    transformTypeReference: function(tree) {
      var typeName = this.transformAny(tree.typeName);
      var args = this.transformAny(tree.args);
      var argumentList = new ArgumentList(tree.location, $__spread([typeName], args));
      return parseExpression($__getTemplateObject(["$traceurRuntime.genericType(", ")"]), argumentList);
    },
    transformTypeArguments: function(tree) {
      return this.transformList(tree.args);
    }
  }, {}, $__super);
}(ParseTreeTransformer);
