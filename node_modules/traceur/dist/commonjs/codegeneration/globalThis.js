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
      return $__default;
    }
  }
});
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var expr;
function globalThis() {
  if (!expr)
    expr = parseExpression($__getTemplateObject(["Reflect.global"]));
  return expr;
}
var $__default = globalThis;
