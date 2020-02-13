"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AsyncToGeneratorTransformer: {
    enumerable: true,
    get: function() {
      return AsyncToGeneratorTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ARGUMENTS = require("../syntax/PredefinedName.js").ARGUMENTS;
var FindArguments = $__interopRequire("./FindArguments.js").default;
var $__7 = require("../syntax/trees/ParseTrees.js"),
    FunctionBody = $__7.FunctionBody,
    FunctionDeclaration = $__7.FunctionDeclaration,
    FunctionExpression = $__7.FunctionExpression,
    Method = $__7.Method,
    YieldExpression = $__7.YieldExpression;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var ParenTrait = require("./ParenTrait.js").ParenTrait;
var parseStatement = require("./PlaceholderParser.js").parseStatement;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__12 = require("./ParseTreeFactory.js"),
    createIdentifierExpression = $__12.createIdentifierExpression,
    createNullLiteral = $__12.createNullLiteral;
var AsyncToGeneratorTransformer = function($__super) {
  function AsyncToGeneratorTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(AsyncToGeneratorTransformer).call(this, identifierGenerator, reporter, options);
    this.inAsyncFunction_ = false;
  }
  return ($__createClass)(AsyncToGeneratorTransformer, {
    transformFunctionDeclaration: function(tree) {
      if (tree.isAsyncFunction()) {
        return this.transformFunctionShared_(tree, FunctionDeclaration);
      }
      return $__superGet(this, AsyncToGeneratorTransformer.prototype, "transformFunctionDeclaration").call(this, tree);
    },
    transformFunctionExpression: function(tree) {
      if (tree.isAsyncFunction()) {
        return this.transformFunctionShared_(tree, FunctionExpression);
      }
      return $__superGet(this, AsyncToGeneratorTransformer.prototype, "transformFunctionExpression").call(this, tree);
    },
    transformFunctionShared_: function(tree, ctor) {
      var parameterList = this.transformAny(tree.parameterList);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var body = this.transformAsyncBody_(tree.body);
      return new ctor(tree.location, tree.name, null, parameterList, typeAnnotation, annotations, body);
    },
    transformAsyncBody_: function(body) {
      var inAsyncFunction = this.inAsyncFunction_;
      this.inAsyncFunction_ = true;
      body = this.transformFunctionBody(body);
      var spawn = this.getRuntimeExpression('spawn');
      body = wrapBodyInSpawn(body, spawn);
      this.inAsyncFunction_ = inAsyncFunction;
      return body;
    },
    transformMethod: function(tree) {
      if (tree.isAsyncFunction()) {
        var name = this.transformAny(tree.name);
        var parameterList = this.transformAny(tree.parameterList);
        var typeAnnotation = this.transformAny(tree.typeAnnotation);
        var annotations = this.transformList(tree.annotations);
        var body = this.transformAsyncBody_(tree.body);
        return new Method(tree.location, tree.isStatic, null, name, parameterList, typeAnnotation, annotations, body, tree.debugName);
      }
      return $__superGet(this, AsyncToGeneratorTransformer.prototype, "transformMethod").call(this, tree);
    },
    transformAwaitExpression: function(tree) {
      if (this.inAsyncFunction_) {
        var expression = this.transformAny(tree.expression);
        return new YieldExpression(tree.location, expression, false);
      }
      return $__superGet(this, AsyncToGeneratorTransformer.prototype, "transformAwaitExpression").call(this, tree);
    }
  }, {}, $__super);
}(ImportRuntimeTrait(ParenTrait(TempVarTransformer)));
function wrapBodyInSpawn(body, spawn) {
  var visitor = new FindArguments();
  visitor.visitAny(body);
  var argExpr = visitor.found ? createIdentifierExpression(ARGUMENTS) : createNullLiteral();
  var statement = parseStatement($__getTemplateObject(["return ", "(this, ", ", function*() { ", " });"]), spawn, argExpr, body);
  return new FunctionBody(body.location, [statement]);
}
