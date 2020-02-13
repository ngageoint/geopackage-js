"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ProperTailCallTransformer: {
    enumerable: true,
    get: function() {
      return ProperTailCallTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var RewriteTailCallsTransformer = require("./RewriteTailCallsTransformer.js").RewriteTailCallsTransformer;
var $__7 = require("./ParseTreeFactory.js"),
    createFunctionBody = $__7.createFunctionBody,
    createFunctionExpression = $__7.createFunctionExpression,
    id = $__7.createIdentifierExpression;
var $__8 = require("./PlaceholderParser.js"),
    parseExpression = $__8.parseExpression,
    parseStatement = $__8.parseStatement,
    parseStatements = $__8.parseStatements;
var $__9 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__9.AnonBlock,
    FunctionDeclaration = $__9.FunctionDeclaration,
    FunctionExpression = $__9.FunctionExpression;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var ProperTailCallTransformer = function($__super) {
  function ProperTailCallTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(ProperTailCallTransformer).call(this, identifierGenerator, reporter, options);
    this.inBlock_ = false;
    this.options = options;
  }
  return ($__createClass)(ProperTailCallTransformer, {
    transformFunctionDeclaration: function(tree) {
      tree = $__superGet(this, ProperTailCallTransformer.prototype, "transformFunctionDeclaration").call(this, tree);
      if (tree.functionKind !== null) {
        return tree;
      }
      var nameIdExpression = id(tree.name.identifierToken);
      var initTailRecursiveFunction = this.getRuntimeExpression('initTailRecursiveFunction');
      var setupFlagExpression = parseExpression($__getTemplateObject(["", "(", ")"]), initTailRecursiveFunction, nameIdExpression);
      var funcDecl = this.transformFunction_(tree, FunctionDeclaration);
      if (funcDecl === tree) {
        return tree;
      }
      var tmpVar = id(this.inBlock_ ? this.getTempIdentifier() : this.addTempVar(setupFlagExpression));
      if (!this.inBlock_) {
        return funcDecl;
      }
      return new AnonBlock(null, [funcDecl, parseStatement($__getTemplateObject(["var ", " = ", ";"]), tmpVar, setupFlagExpression)]);
    },
    transformFunctionExpression: function(tree) {
      tree = $__superGet(this, ProperTailCallTransformer.prototype, "transformFunctionExpression").call(this, tree);
      if (tree.functionKind) {
        return tree;
      }
      var functionExpression = this.transformFunction_(tree, FunctionExpression);
      if (functionExpression === tree) {
        return tree;
      }
      var initTailRecursiveFunction = this.getRuntimeExpression('initTailRecursiveFunction');
      return parseExpression($__getTemplateObject(["", "(", ")"]), initTailRecursiveFunction, functionExpression);
    },
    transformFunction_: function(tree, constructor) {
      var body = RewriteTailCallsTransformer.transform(this, tree.body);
      if (body === tree.body) {
        return tree;
      }
      var func = id(this.getTempIdentifier());
      var innerFunction = createFunctionExpression(tree.parameterList, body);
      var call = this.getRuntimeExpression('call');
      var outerBody = createFunctionBody(parseStatements($__getTemplateObject(["\n        return ", "(", ", this, arguments);"]), call, innerFunction));
      return new constructor(tree.location, tree.name, tree.functionKind, tree.parameterList, tree.typeAnnotation, tree.annotations, outerBody);
    },
    transformBlock: function(tree) {
      var inBlock = this.inBlock_;
      this.inBlock_ = true;
      var rv = $__superGet(this, ProperTailCallTransformer.prototype, "transformBlock").call(this, tree);
      this.inBlock_ = inBlock;
      return rv;
    }
  }, {}, $__super);
}(ImportRuntimeTrait(TempVarTransformer));
