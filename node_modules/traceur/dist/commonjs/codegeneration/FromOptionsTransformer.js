"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FromOptionsTransformer: {
    enumerable: true,
    get: function() {
      return FromOptionsTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var AmdTransformer = require("./AmdTransformer.js").AmdTransformer;
var AnnotationsTransformer = require("./AnnotationsTransformer.js").AnnotationsTransformer;
var ArrayComprehensionTransformer = require("./ArrayComprehensionTransformer.js").ArrayComprehensionTransformer;
var ArrowFunctionTransformer = require("./ArrowFunctionTransformer.js").ArrowFunctionTransformer;
var AsyncGeneratorTransformPass = require("./AsyncGeneratorTransformPass.js").AsyncGeneratorTransformPass;
var AsyncToGeneratorTransformer = require("./AsyncToGeneratorTransformer.js").AsyncToGeneratorTransformer;
var BlockBindingTransformer = require("./BlockBindingTransformer.js").BlockBindingTransformer;
var ClassTransformer = require("./ClassTransformer.js").ClassTransformer;
var ClosureModuleTransformer = require("./ClosureModuleTransformer.js").ClosureModuleTransformer;
var CommonJsModuleTransformer = require("./CommonJsModuleTransformer.js").CommonJsModuleTransformer;
var DefaultParametersTransformer = require("./DefaultParametersTransformer.js").DefaultParametersTransformer;
var DestructuringTransformer = require("./DestructuringTransformer.js").DestructuringTransformer;
var ExponentiationTransformer = require("./ExponentiationTransformer.js").ExponentiationTransformer;
var ForOfTransformer = require("./ForOfTransformer.js").ForOfTransformer;
var ForOnTransformer = require("./ForOnTransformer.js").ForOnTransformer;
var GeneratorComprehensionTransformer = require("./GeneratorComprehensionTransformer.js").GeneratorComprehensionTransformer;
var GeneratorTransformPass = require("./GeneratorTransformPass.js").GeneratorTransformPass;
var InlineModuleTransformer = require("./InlineModuleTransformer.js").InlineModuleTransformer;
var InstantiateModuleTransformer = require("./InstantiateModuleTransformer.js").InstantiateModuleTransformer;
var JsxTransformer = require("./JsxTransformer.js").JsxTransformer;
var MemberVariableTransformer = require("./MemberVariableTransformer.js").MemberVariableTransformer;
var ModuleTransformer = require("./ModuleTransformer.js").ModuleTransformer;
var MultiTransformer = require("./MultiTransformer.js").MultiTransformer;
var NumericLiteralTransformer = require("./NumericLiteralTransformer.js").NumericLiteralTransformer;
var ObjectLiteralTransformer = require("./ObjectLiteralTransformer.js").ObjectLiteralTransformer;
var ProperTailCallTransformer = require("./ProperTailCallTransformer.js").ProperTailCallTransformer;
var PropertyNameShorthandTransformer = require("./PropertyNameShorthandTransformer.js").PropertyNameShorthandTransformer;
var RegularExpressionTransformer = require("./RegularExpressionTransformer.js").RegularExpressionTransformer;
var RestParameterTransformer = require("./RestParameterTransformer.js").RestParameterTransformer;
var SpreadPropertiesTransformer = require("./SpreadPropertiesTransformer.js").SpreadPropertiesTransformer;
var SpreadTransformer = require("./SpreadTransformer.js").SpreadTransformer;
var SuperTransformer = require("./SuperTransformer.js").SuperTransformer;
var SymbolTransformer = require("./SymbolTransformer.js").SymbolTransformer;
var TemplateLiteralTransformer = require("./TemplateLiteralTransformer.js").TemplateLiteralTransformer;
var TypeToExpressionTransformer = require("./TypeToExpressionTransformer.js").TypeToExpressionTransformer;
var TypeTransformer = require("./TypeTransformer.js").TypeTransformer;
var UnicodeEscapeSequenceTransformer = require("./UnicodeEscapeSequenceTransformer.js").UnicodeEscapeSequenceTransformer;
var UniqueIdentifierGenerator = require("./UniqueIdentifierGenerator.js").UniqueIdentifierGenerator;
var validateConst = require("../semantics/ConstChecker.js").validate;
var validateFreeVariables = require("../semantics/FreeVariableChecker.js").validate;
var FromOptionsTransformer = function($__super) {
  function FromOptionsTransformer(reporter, options) {
    var $__1;
    $__superConstructor(FromOptionsTransformer).call(this, reporter, options.validate);
    var transformOptions = options.transformOptions;
    var idGenerator = new UniqueIdentifierGenerator();
    var append = ($__1 = this, function(transformer) {
      $__1.append(function(tree) {
        return new transformer(idGenerator, reporter, options).transformAny(tree);
      });
    });
    if (transformOptions.blockBinding) {
      this.append(function(tree) {
        validateConst(tree, reporter);
        return tree;
      });
    }
    if (options.freeVariableChecker) {
      this.append(function(tree) {
        validateFreeVariables(tree, reporter);
        return tree;
      });
    }
    if (transformOptions.exponentiation)
      append(ExponentiationTransformer);
    if (transformOptions.numericLiterals)
      append(NumericLiteralTransformer);
    if (transformOptions.unicodeExpressions)
      append(RegularExpressionTransformer);
    if (transformOptions.jsx) {
      append(JsxTransformer);
    }
    if (transformOptions.templateLiterals)
      append(TemplateLiteralTransformer);
    if (transformOptions.types && transformOptions.annotations) {
      append(TypeToExpressionTransformer);
    }
    if (transformOptions.unicodeEscapeSequences)
      append(UnicodeEscapeSequenceTransformer);
    if (transformOptions.annotations)
      append(AnnotationsTransformer);
    if (transformOptions.propertyNameShorthand)
      append(PropertyNameShorthandTransformer);
    if (transformOptions.memberVariables) {
      append(MemberVariableTransformer);
    }
    if (transformOptions.classes) {
      append(SuperTransformer);
    }
    if (transformOptions.arrowFunctions) {
      append(ArrowFunctionTransformer);
    }
    if (transformOptions.classes) {
      append(ClassTransformer);
    }
    if (transformOptions.spreadProperties) {
      append(SpreadPropertiesTransformer);
    }
    if (transformOptions.propertyMethods || transformOptions.computedPropertyNames || transformOptions.properTailCalls) {
      append(ObjectLiteralTransformer);
    }
    if (transformOptions.generatorComprehension)
      append(GeneratorComprehensionTransformer);
    if (transformOptions.arrayComprehension)
      append(ArrayComprehensionTransformer);
    if (transformOptions.forOf)
      append(ForOfTransformer);
    if (transformOptions.asyncGenerators) {
      append(AsyncGeneratorTransformPass);
    }
    if (transformOptions.forOn)
      append(ForOnTransformer);
    if (transformOptions.restParameters)
      append(RestParameterTransformer);
    if (transformOptions.defaultParameters)
      append(DefaultParametersTransformer);
    if (transformOptions.destructuring)
      append(DestructuringTransformer);
    if (transformOptions.types)
      append(TypeTransformer);
    if (transformOptions.spread)
      append(SpreadTransformer);
    if (transformOptions.blockBinding) {
      this.append(function(tree) {
        var transformer = new BlockBindingTransformer(idGenerator, reporter, tree);
        return transformer.transformAny(tree);
      });
    }
    if (transformOptions.asyncFunctions && options.generators === 'parse') {
      append(AsyncToGeneratorTransformer);
    } else if (transformOptions.generators || transformOptions.asyncFunctions) {
      append(GeneratorTransformPass);
    }
    if (transformOptions.symbols)
      append(SymbolTransformer);
    if (transformOptions.properTailCalls) {
      append(ProperTailCallTransformer);
    }
    if (transformOptions.modules) {
      switch (transformOptions.modules) {
        case 'commonjs':
          append(CommonJsModuleTransformer);
          break;
        case 'amd':
          append(AmdTransformer);
          break;
        case 'closure':
          append(ClosureModuleTransformer);
          break;
        case 'inline':
          append(InlineModuleTransformer);
          break;
        case 'instantiate':
          append(InstantiateModuleTransformer);
          break;
        case 'bootstrap':
          append(ModuleTransformer);
          break;
        case 'parse':
          break;
        default:
          throw new Error('Invalid modules transform option');
      }
    }
  }
  return ($__createClass)(FromOptionsTransformer, {}, {}, $__super);
}(MultiTransformer);
