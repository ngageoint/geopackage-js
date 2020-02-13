"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  PureES6Transformer: {
    enumerable: true,
    get: function() {
      return PureES6Transformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var AnnotationsTransformer = require("./AnnotationsTransformer.js").AnnotationsTransformer;
var AsyncToGeneratorTransformer = require("./AsyncToGeneratorTransformer.js").AsyncToGeneratorTransformer;
var InlineES6ModuleTransformer = require("./InlineES6ModuleTransformer.js").InlineES6ModuleTransformer;
var JsxTransformer = require("./JsxTransformer.js").JsxTransformer;
var MemberVariableTransformer = require("./MemberVariableTransformer.js").MemberVariableTransformer;
var MultiTransformer = require("./MultiTransformer.js").MultiTransformer;
var SpreadPropertiesTransformer = require("./SpreadPropertiesTransformer.js").SpreadPropertiesTransformer;
var TypeTransformer = require("./TypeTransformer.js").TypeTransformer;
var UniqueIdentifierGenerator = require("./UniqueIdentifierGenerator.js").UniqueIdentifierGenerator;
var validateFreeVariables = require("../semantics/FreeVariableChecker.js").validate;
var PureES6Transformer = function($__super) {
  function PureES6Transformer(reporter, options, metadata) {
    var $__1;
    $__superConstructor(PureES6Transformer).call(this, reporter, options.validate);
    var idGenerator = new UniqueIdentifierGenerator();
    var append = ($__1 = this, function(transformer) {
      $__1.append(function(tree) {
        return new transformer(idGenerator, reporter, options, metadata).transformAny(tree);
      });
    });
    if (options.freeVariableChecker) {
      this.append(function(tree) {
        validateFreeVariables(tree, reporter);
        return tree;
      });
    }
    if (options.jsx) {
      append(JsxTransformer);
    }
    if (options.spreadProperties) {
      append(SpreadPropertiesTransformer);
    }
    if (options.memberVariables) {
      append(MemberVariableTransformer);
    }
    append(AnnotationsTransformer);
    append(TypeTransformer);
    append(AsyncToGeneratorTransformer);
    if (options.modules === 'inline') {
      append(InlineES6ModuleTransformer);
    }
  }
  return ($__createClass)(PureES6Transformer, {}, {}, $__super);
}(MultiTransformer);
