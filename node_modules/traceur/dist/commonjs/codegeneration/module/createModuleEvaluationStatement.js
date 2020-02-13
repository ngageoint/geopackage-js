"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  createModuleEvaluationStatement: {
    enumerable: true,
    get: function() {
      return createModuleEvaluationStatement;
    }
  }
});
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var parseStatement = require("../PlaceholderParser.js").parseStatement;
function createModuleEvaluationStatement(normalizedName) {
  return parseStatement($__getTemplateObject(["$traceurRuntime.getModule(", " +'')"]), normalizedName);
}
