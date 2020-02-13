"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  NumericLiteralTransformer: {
    enumerable: true,
    get: function() {
      return NumericLiteralTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__4 = require("../syntax/trees/ParseTrees.js"),
    LiteralExpression = $__4.LiteralExpression,
    LiteralPropertyName = $__4.LiteralPropertyName;
var LiteralToken = require("../syntax/LiteralToken.js").LiteralToken;
var NUMBER = require("../syntax/TokenType.js").NUMBER;
function needsTransform(token) {
  return token.type === NUMBER && /^0[bBoO]/.test(token.value);
}
function transformToken(token) {
  return new LiteralToken(NUMBER, String(token.processedValue), token.location);
}
var NumericLiteralTransformer = function($__super) {
  function NumericLiteralTransformer() {
    $__superConstructor(NumericLiteralTransformer).apply(this, arguments);
  }
  return ($__createClass)(NumericLiteralTransformer, {
    transformLiteralExpression: function(tree) {
      var token = tree.literalToken;
      if (needsTransform(token))
        return new LiteralExpression(tree.location, transformToken(token));
      return tree;
    },
    transformLiteralPropertyName: function(tree) {
      var token = tree.literalToken;
      if (needsTransform(token))
        return new LiteralPropertyName(tree.location, transformToken(token));
      return tree;
    }
  }, {}, $__super);
}(ParseTreeTransformer);
