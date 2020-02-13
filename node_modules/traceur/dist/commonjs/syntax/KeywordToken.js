"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  KeywordToken: {
    enumerable: true,
    get: function() {
      return KeywordToken;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var STRICT_KEYWORD = require("./Keywords.js").STRICT_KEYWORD;
var Token = require("./Token.js").Token;
var KeywordToken = function($__super) {
  function KeywordToken(type, keywordType, location) {
    $__superConstructor(KeywordToken).call(this, type, location);
    this.isStrictKeyword_ = keywordType === STRICT_KEYWORD;
  }
  return ($__createClass)(KeywordToken, {
    isKeyword: function() {
      return true;
    },
    isStrictKeyword: function() {
      return this.isStrictKeyword_;
    }
  }, {}, $__super);
}(Token);
