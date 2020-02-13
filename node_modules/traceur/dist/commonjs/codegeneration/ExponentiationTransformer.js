"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ExponentiationTransformer: {
    enumerable: true,
    get: function() {
      return ExponentiationTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ExplodeExpressionTransformer = require("./ExplodeExpressionTransformer.js").ExplodeExpressionTransformer;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var ParenTrait = require("./ParenTrait.js").ParenTrait;
var $__8 = require("../syntax/TokenType.js"),
    STAR_STAR = $__8.STAR_STAR,
    STAR_STAR_EQUAL = $__8.STAR_STAR_EQUAL;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var ExponentiationTransformer = function($__super) {
  function ExponentiationTransformer() {
    $__superConstructor(ExponentiationTransformer).apply(this, arguments);
  }
  return ($__createClass)(ExponentiationTransformer, {transformBinaryExpression: function(tree) {
      switch (tree.operator.type) {
        case STAR_STAR:
          {
            var left = this.transformAny(tree.left);
            var right = this.transformAny(tree.right);
            return parseExpression($__getTemplateObject(["Math.pow(", ", ", ")"]), left, right);
          }
        case STAR_STAR_EQUAL:
          {
            var exploded = new ExplodeExpressionTransformer(this).transformAny(tree);
            return this.transformAny(exploded);
          }
      }
      return $__superGet(this, ExponentiationTransformer.prototype, "transformBinaryExpression").call(this, tree);
    }}, {}, $__super);
}(ParenTrait(TempVarTransformer));
