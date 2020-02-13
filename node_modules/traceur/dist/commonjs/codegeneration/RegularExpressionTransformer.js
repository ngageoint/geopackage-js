"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  RegularExpressionTransformer: {
    enumerable: true,
    get: function() {
      return RegularExpressionTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var LiteralExpression = require("../syntax/trees/ParseTrees.js").LiteralExpression;
var LiteralToken = require("../syntax/LiteralToken.js").LiteralToken;
var REGULAR_EXPRESSION = require("../syntax/TokenType.js").REGULAR_EXPRESSION;
var regexpuRewritePattern = require("../outputgeneration/regexpuRewritePattern.js").regexpuRewritePattern;
var RegularExpressionTransformer = function($__super) {
  function RegularExpressionTransformer() {
    $__superConstructor(RegularExpressionTransformer).apply(this, arguments);
  }
  return ($__createClass)(RegularExpressionTransformer, {transformLiteralExpression: function(tree) {
      var token = tree.literalToken;
      if (token.type === REGULAR_EXPRESSION) {
        var value = token.value;
        var lastIndex = value.lastIndexOf('/');
        var pattern = value.slice(1, lastIndex);
        var flags = value.slice(lastIndex + 1);
        if (flags.indexOf('u') !== -1) {
          var result = '/' + regexpuRewritePattern(pattern, flags) + '/' + flags.replace('u', '');
          return new LiteralExpression(tree.location, new LiteralToken(REGULAR_EXPRESSION, result, token.location));
        }
      }
      return tree;
    }}, {}, $__super);
}(ParseTreeTransformer);
