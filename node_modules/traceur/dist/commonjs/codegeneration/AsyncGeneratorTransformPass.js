"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AsyncGeneratorTransformPass: {
    enumerable: true,
    get: function() {
      return AsyncGeneratorTransformPass;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var AsyncGeneratorTransformer = require("./AsyncGeneratorTransformer.js").AsyncGeneratorTransformer;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__7 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__7.AnonBlock,
    FunctionDeclaration = $__7.FunctionDeclaration,
    FunctionExpression = $__7.FunctionExpression;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var $__9 = require("./ParseTreeFactory.js"),
    createBindingIdentifier = $__9.createBindingIdentifier,
    id = $__9.createIdentifierExpression,
    createIdentifierToken = $__9.createIdentifierToken;
var $__10 = require("./PlaceholderParser.js"),
    parseExpression = $__10.parseExpression,
    parseStatement = $__10.parseStatement;
var AsyncGeneratorTransformPass = function($__super) {
  function AsyncGeneratorTransformPass(identifierGenerator, reporter, options) {
    $__superConstructor(AsyncGeneratorTransformPass).call(this, identifierGenerator, reporter, options);
    this.transformOptions_ = options.transformOptions;
    this.inBlock_ = false;
  }
  return ($__createClass)(AsyncGeneratorTransformPass, {
    needsTransform_: function(tree) {
      return this.transformOptions_.asyncGenerators && tree.isAsyncGenerator();
    },
    transformFunctionDeclaration: function(tree) {
      if (!this.needsTransform_(tree))
        return $__superGet(this, AsyncGeneratorTransformPass.prototype, "transformFunctionDeclaration").call(this, tree);
      var nameIdExpression = id(tree.name.identifierToken);
      var initAsyncGeneratorFunction = this.getRuntimeExpression('initAsyncGeneratorFunction');
      var setupPrototypeExpression = parseExpression($__getTemplateObject(["", "(", ")"]), initAsyncGeneratorFunction, nameIdExpression);
      var tmpVar = id(this.inBlock_ ? this.getTempIdentifier() : this.addTempVar(setupPrototypeExpression));
      var funcDecl = this.transformFunction_(tree, FunctionDeclaration, tmpVar);
      if (!this.inBlock_)
        return funcDecl;
      return new AnonBlock(null, [funcDecl, parseStatement($__getTemplateObject(["var ", " = ", ""]), tmpVar, setupPrototypeExpression)]);
    },
    transformFunctionExpression: function(tree) {
      if (!this.needsTransform_(tree)) {
        return $__superGet(this, AsyncGeneratorTransformPass.prototype, "transformFunctionExpression").call(this, tree);
      }
      var name;
      if (!tree.name) {
        name = createIdentifierToken(this.getTempIdentifier());
        tree = new FunctionExpression(tree.location, createBindingIdentifier(name), tree.functionKind, tree.parameterList, tree.typeAnnotation, tree.annotations, tree.body);
      } else {
        name = tree.name.identifierToken;
      }
      var functionExpression = this.transformFunction_(tree, FunctionExpression, id(name));
      var initAsyncGeneratorFunction = this.getRuntimeExpression('initAsyncGeneratorFunction');
      return parseExpression($__getTemplateObject(["", "(", ")"]), initAsyncGeneratorFunction, functionExpression);
    },
    transformFunction_: function(tree, constructor, nameExpression) {
      var body = $__superGet(this, AsyncGeneratorTransformPass.prototype, "transformAny").call(this, tree.body);
      body = AsyncGeneratorTransformer.transformAsyncGeneratorBody(this.identifierGenerator, this.reporter, this.options, body, nameExpression);
      var functionKind = null;
      return new constructor(tree.location, tree.name, functionKind, tree.parameterList, tree.typeAnnotation || null, tree.annotations || null, body);
    },
    transformBlock: function(tree) {
      var inBlock = this.inBlock_;
      this.inBlock_ = true;
      var rv = $__superGet(this, AsyncGeneratorTransformPass.prototype, "transformBlock").call(this, tree);
      this.inBlock_ = inBlock;
      return rv;
    }
  }, {}, $__super);
}(ImportRuntimeTrait(TempVarTransformer));
