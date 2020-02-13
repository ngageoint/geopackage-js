"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  GeneratorTransformPass: {
    enumerable: true,
    get: function() {
      return GeneratorTransformPass;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ArrowFunctionTransformer = require("./ArrowFunctionTransformer.js").ArrowFunctionTransformer;
var AsyncTransformer = require("./generator/AsyncTransformer.js").AsyncTransformer;
var ForInTransformPass = require("./generator/ForInTransformPass.js").ForInTransformPass;
var GeneratorTransformer = require("./generator/GeneratorTransformer.js").GeneratorTransformer;
var $__12 = require("./PlaceholderParser.js"),
    parseExpression = $__12.parseExpression,
    parseStatement = $__12.parseStatement;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var FindInFunctionScope = require("./FindInFunctionScope.js").FindInFunctionScope;
var $__16 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__16.AnonBlock,
    FunctionDeclaration = $__16.FunctionDeclaration,
    FunctionExpression = $__16.FunctionExpression;
var $__17 = require("./ParseTreeFactory.js"),
    createBindingIdentifier = $__17.createBindingIdentifier,
    id = $__17.createIdentifierExpression,
    createIdentifierToken = $__17.createIdentifierToken;
var ForInFinder = function($__super) {
  function ForInFinder() {
    $__superConstructor(ForInFinder).apply(this, arguments);
  }
  return ($__createClass)(ForInFinder, {visitForInStatement: function(tree) {
      this.found = true;
    }}, {}, $__super);
}(FindInFunctionScope);
function needsTransform(tree, transformOptions) {
  return transformOptions.generators && tree.isGenerator() || transformOptions.asyncFunctions && tree.isAsyncFunction();
}
var GeneratorTransformPass = function($__super) {
  function GeneratorTransformPass(identifierGenerator, reporter, options) {
    $__superConstructor(GeneratorTransformPass).call(this, identifierGenerator, reporter, options);
    this.tranformOptions_ = options.transformOptions;
    this.inBlock_ = false;
  }
  return ($__createClass)(GeneratorTransformPass, {
    transformFunctionDeclaration: function(tree) {
      if (!needsTransform(tree, this.tranformOptions_))
        return $__superGet(this, GeneratorTransformPass.prototype, "transformFunctionDeclaration").call(this, tree);
      if (tree.isGenerator())
        return this.transformGeneratorDeclaration_(tree);
      return this.transformFunction_(tree, FunctionDeclaration, null);
    },
    transformGeneratorDeclaration_: function(tree) {
      var nameIdExpression = id(tree.name.identifierToken);
      var initGeneratorFunction = this.getRuntimeExpression('initGeneratorFunction');
      var setupPrototypeExpression = parseExpression($__getTemplateObject(["", "(", ")"]), initGeneratorFunction, nameIdExpression);
      var tmpVar = id(this.inBlock_ ? this.getTempIdentifier() : this.addTempVar(setupPrototypeExpression));
      var funcDecl = this.transformFunction_(tree, FunctionDeclaration, tmpVar);
      if (!this.inBlock_)
        return funcDecl;
      return new AnonBlock(null, [funcDecl, parseStatement($__getTemplateObject(["var ", " = ", ""]), tmpVar, setupPrototypeExpression)]);
    },
    transformFunctionExpression: function(tree) {
      if (!needsTransform(tree, this.tranformOptions_))
        return $__superGet(this, GeneratorTransformPass.prototype, "transformFunctionExpression").call(this, tree);
      if (tree.isGenerator())
        return this.transformGeneratorExpression_(tree);
      return this.transformFunction_(tree, FunctionExpression, null);
    },
    transformGeneratorExpression_: function(tree) {
      var name;
      if (!tree.name) {
        name = createIdentifierToken(this.getTempIdentifier());
        tree = new FunctionExpression(tree.location, createBindingIdentifier(name), tree.functionKind, tree.parameterList, tree.typeAnnotation, tree.annotations, tree.body);
      } else {
        name = tree.name.identifierToken;
      }
      var functionExpression = this.transformFunction_(tree, FunctionExpression, id(name));
      var initGeneratorFunction = this.getRuntimeExpression('initGeneratorFunction');
      return parseExpression($__getTemplateObject(["", "(", ")"]), initGeneratorFunction, functionExpression);
    },
    transformFunction_: function(tree, constructor, nameExpression) {
      var $__2 = this;
      var body = $__superGet(this, GeneratorTransformPass.prototype, "transformAny").call(this, tree.body);
      var finder = new ForInFinder();
      finder.visitAny(body);
      if (finder.found) {
        body = new ForInTransformPass(this.identifierGenerator, this.reporter, this.options).transformAny(body);
      }
      if (this.tranformOptions_.generators && tree.isGenerator()) {
        var transformer = new GeneratorTransformer(this.identifierGenerator, this.reporter, this.options);
        body = transformer.transformGeneratorBody(body, nameExpression);
        transformer.requiredNames.forEach(function(n) {
          $__2.addImportedName(n);
        });
      } else if (this.tranformOptions_.asyncFunctions && tree.isAsyncFunction()) {
        var transformer$__3 = new AsyncTransformer(this.identifierGenerator, this.reporter, this.options);
        body = transformer$__3.transformAsyncBody(body, nameExpression);
        transformer$__3.requiredNames.forEach(function(n) {
          $__2.addImportedName(n);
        });
      }
      var functionKind = null;
      return new constructor(tree.location, tree.name, functionKind, tree.parameterList, tree.typeAnnotation || null, tree.annotations || null, body);
    },
    transformArrowFunction: function(tree) {
      if (!tree.isAsyncFunction())
        return $__superGet(this, GeneratorTransformPass.prototype, "transformArrowFunction").call(this, tree);
      return this.transformAny(ArrowFunctionTransformer.transform(this, tree));
    },
    transformBlock: function(tree) {
      var inBlock = this.inBlock_;
      this.inBlock_ = true;
      var rv = $__superGet(this, GeneratorTransformPass.prototype, "transformBlock").call(this, tree);
      this.inBlock_ = inBlock;
      return rv;
    }
  }, {}, $__super);
}(ImportRuntimeTrait(TempVarTransformer));
