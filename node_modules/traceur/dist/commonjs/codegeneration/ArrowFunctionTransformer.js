"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ArrowFunctionTransformer: {
    enumerable: true,
    get: function() {
      return ArrowFunctionTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__4 = require("../syntax/PredefinedName.js"),
    ARGUMENTS = $__4.ARGUMENTS,
    CONSTRUCTOR = $__4.CONSTRUCTOR,
    THIS = $__4.THIS;
var AlphaRenamer = require("./AlphaRenamer.js").AlphaRenamer;
var FunctionExpression = require("../syntax/trees/ParseTrees.js").FunctionExpression;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var ParenTrait = require("./ParenTrait.js").ParenTrait;
var alphaRenameThisAndArguments = $__interopRequire("./alphaRenameThisAndArguments.js").default;
var $__10 = require("../syntax/trees/ParseTreeType.js"),
    FUNCTION_BODY = $__10.FUNCTION_BODY,
    LITERAL_PROPERTY_NAME = $__10.LITERAL_PROPERTY_NAME;
var FindThisOrArguments = require("./FindThisOrArguments.js").FindThisOrArguments;
var $__12 = require("./ParseTreeFactory.js"),
    createAssignmentExpression = $__12.createAssignmentExpression,
    createCommaExpression = $__12.createCommaExpression,
    createFunctionBody = $__12.createFunctionBody,
    createIdentifierExpression = $__12.createIdentifierExpression,
    createReturnStatement = $__12.createReturnStatement,
    createThisExpression = $__12.createThisExpression;
function convertConciseBody(tree) {
  if (tree.type !== FUNCTION_BODY)
    return createFunctionBody([createReturnStatement(tree)]);
  return tree;
}
var ArrowFunctionTransformer = function($__super) {
  function ArrowFunctionTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(ArrowFunctionTransformer).call(this, identifierGenerator, reporter, options);
    this.inDerivedClass_ = false;
    this.inConstructor_ = false;
  }
  return ($__createClass)(ArrowFunctionTransformer, {
    transformArrowFunction: function(tree) {
      if (this.inDerivedClass_ && this.inConstructor_) {
        return this.transformUsingCommaExpression_(tree);
      }
      return this.transformUsingTempVar_(tree);
    },
    transformUsingCommaExpression_: function(tree) {
      var finder = new FindThisOrArguments();
      var argumentsTempName,
          thisTempName;
      finder.visitAny(tree);
      if (finder.foundArguments) {
        argumentsTempName = this.addTempVar();
        tree = AlphaRenamer.rename(tree, ARGUMENTS, argumentsTempName);
      }
      if (finder.foundThis) {
        thisTempName = this.addTempVar();
        tree = AlphaRenamer.rename(tree, THIS, thisTempName);
      }
      var parameterList = this.transformAny(tree.parameterList);
      var body = this.transformAny(tree.body);
      body = convertConciseBody(body);
      var functionExpression = new FunctionExpression(tree.location, null, tree.functionKind, parameterList, null, [], body);
      var expressions = [];
      if (argumentsTempName) {
        expressions.push(createAssignmentExpression(createIdentifierExpression(argumentsTempName), createIdentifierExpression(ARGUMENTS)));
      }
      if (thisTempName) {
        expressions.push(createAssignmentExpression(createIdentifierExpression(thisTempName), createThisExpression()));
      }
      if (expressions.length === 0) {
        return functionExpression;
      }
      expressions.push(functionExpression);
      return createCommaExpression(expressions);
    },
    transformUsingTempVar_: function(tree) {
      var alphaRenamed = alphaRenameThisAndArguments(this, tree);
      var parameterList = this.transformAny(alphaRenamed.parameterList);
      var body = this.transformAny(alphaRenamed.body);
      body = convertConciseBody(body);
      var functionExpression = new FunctionExpression(tree.location, null, tree.functionKind, parameterList, null, [], body);
      return functionExpression;
    },
    transformClassExpression: function(tree) {
      var inDerivedClass = this.inDerivedClass_;
      this.inDerivedClass_ = tree.superClass !== null;
      var result = $__superGet(this, ArrowFunctionTransformer.prototype, "transformClassExpression").call(this, tree);
      this.inDerivedClass_ = inDerivedClass;
      return result;
    },
    transformClassDeclaration: function(tree) {
      var inDerivedClass = this.inDerivedClass_;
      this.inDerivedClass_ = tree.superClass !== null;
      var result = $__superGet(this, ArrowFunctionTransformer.prototype, "transformClassDeclaration").call(this, tree);
      this.inDerivedClass_ = inDerivedClass;
      return result;
    },
    transformMethod: function(tree) {
      var inConstructor = this.inConstructor_;
      this.inConstructor_ = !tree.isStatic && tree.functionKind === null && tree.name.type === LITERAL_PROPERTY_NAME && tree.name.literalToken.value === CONSTRUCTOR;
      var result = $__superGet(this, ArrowFunctionTransformer.prototype, "transformMethod").call(this, tree);
      this.inConstructor_ = inConstructor;
      return result;
    }
  }, {transform: function(tempVarTransformer, tree) {
      tree = alphaRenameThisAndArguments(tempVarTransformer, tree);
      var body = convertConciseBody(tree.body);
      return new FunctionExpression(tree.location, null, tree.functionKind, tree.parameterList, null, [], body);
    }}, $__super);
}(ParenTrait(TempVarTransformer));
