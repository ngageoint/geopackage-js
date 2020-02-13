"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  GeneratorComprehensionTransformer: {
    enumerable: true,
    get: function() {
      return GeneratorComprehensionTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ComprehensionTransformer = require("./ComprehensionTransformer.js").ComprehensionTransformer;
var parseStatement = require("./PlaceholderParser.js").parseStatement;
var GeneratorComprehensionTransformer = function($__super) {
  function GeneratorComprehensionTransformer() {
    $__superConstructor(GeneratorComprehensionTransformer).apply(this, arguments);
  }
  return ($__createClass)(GeneratorComprehensionTransformer, {transformGeneratorComprehension: function(tree) {
      var expression = this.transformAny(tree.expression);
      var statement = parseStatement($__getTemplateObject(["yield ", ""]), expression);
      var isGenerator = true;
      return this.transformComprehension(tree, statement, isGenerator);
    }}, {}, $__super);
}(ComprehensionTransformer);
