"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  IdentifierToken: {
    enumerable: true,
    get: function() {
      return IdentifierToken;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var Token = require("./Token.js").Token;
var IDENTIFIER = require("./TokenType.js").IDENTIFIER;
var IdentifierToken = function($__super) {
  function IdentifierToken(location, value) {
    $__superConstructor(IdentifierToken).call(this, IDENTIFIER, location);
    this.value = value;
  }
  return ($__createClass)(IdentifierToken, {toString: function() {
      return this.value;
    }}, {}, $__super);
}(Token);
