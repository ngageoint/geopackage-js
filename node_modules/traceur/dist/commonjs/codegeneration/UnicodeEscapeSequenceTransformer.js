"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  UnicodeEscapeSequenceTransformer: {
    enumerable: true,
    get: function() {
      return UnicodeEscapeSequenceTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var LiteralExpression = require("../syntax/trees/ParseTrees.js").LiteralExpression;
var LiteralToken = require("../syntax/LiteralToken.js").LiteralToken;
var STRING = require("../syntax/TokenType.js").STRING;
var re = /(\\*)\\u{([0-9a-fA-F]+)}/g;
function zeroPad(value) {
  return '0000'.slice(value.length) + value;
}
function needsTransform(token) {
  return token.type === STRING && re.test(token.value);
}
function transformToken(token) {
  return token.value.replace(re, function(match, backslashes, hexDigits) {
    var backslashIsEscaped = backslashes.length % 2 === 1;
    if (backslashIsEscaped) {
      return match;
    }
    var codePoint = parseInt(hexDigits, 16);
    var value;
    if (codePoint <= 0xFFFF) {
      value = '\\u' + zeroPad(codePoint.toString(16).toUpperCase());
    } else {
      var high = Math.floor((codePoint - 0x10000) / 0x400) + 0xD800;
      var low = (codePoint - 0x10000) % 0x400 + 0xDC00;
      value = '\\u' + high.toString(16).toUpperCase() + '\\u' + low.toString(16).toUpperCase();
    }
    return backslashes + value;
  });
}
var UnicodeEscapeSequenceTransformer = function($__super) {
  function UnicodeEscapeSequenceTransformer() {
    $__superConstructor(UnicodeEscapeSequenceTransformer).apply(this, arguments);
  }
  return ($__createClass)(UnicodeEscapeSequenceTransformer, {transformLiteralExpression: function(tree) {
      var token = tree.literalToken;
      if (needsTransform(token)) {
        var value = transformToken(token);
        return new LiteralExpression(tree.location, new LiteralToken(STRING, value, token.location));
      }
      return tree;
    }}, {}, $__super);
}(ParseTreeTransformer);
