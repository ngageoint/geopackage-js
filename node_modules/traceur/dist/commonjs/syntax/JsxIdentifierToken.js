"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  JsxIdentifierToken: {
    enumerable: true,
    get: function() {
      return JsxIdentifierToken;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var Token = require("./Token.js").Token;
var JSX_IDENTIFIER = require("./TokenType.js").JSX_IDENTIFIER;
var JsxIdentifierToken = function($__super) {
  function JsxIdentifierToken(location, value) {
    $__superConstructor(JsxIdentifierToken).call(this, JSX_IDENTIFIER, location);
    this.value = value;
  }
  return ($__createClass)(JsxIdentifierToken, {toString: function() {
      return this.value;
    }}, {}, $__super);
}(Token);
