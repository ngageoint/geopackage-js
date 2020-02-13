"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AsyncGeneratorTransformer: {
    enumerable: true,
    get: function() {
      return AsyncGeneratorTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var alphaRenameThisAndArguments = $__interopRequire("./alphaRenameThisAndArguments.js").default;
var $__6 = require("./ParseTreeFactory.js"),
    createArgumentList = $__6.createArgumentList,
    createBlock = $__6.createBlock,
    createFunctionBody = $__6.createFunctionBody,
    id = $__6.createIdentifierExpression,
    createMemberExpression = $__6.createMemberExpression,
    createThisExpression = $__6.createThisExpression,
    createVariableDeclaration = $__6.createVariableDeclaration,
    createVariableDeclarationList = $__6.createVariableDeclarationList,
    createVariableStatement = $__6.createVariableStatement;
var parseStatement = require("./PlaceholderParser.js").parseStatement;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__10 = require("../syntax/trees/ParseTrees.js"),
    AwaitExpression = $__10.AwaitExpression,
    Block = $__10.Block,
    CallExpression = $__10.CallExpression,
    Catch = $__10.Catch;
var SkipFunctionsTransformerTrait = $__interopRequire("./SkipFunctionsTransformerTrait.js").default;
var ARGUMENTS = require("../syntax/PredefinedName.js").ARGUMENTS;
var VAR = require("../syntax/TokenType.js").VAR;
var AsyncGeneratorTransformer = function($__super) {
  function AsyncGeneratorTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(AsyncGeneratorTransformer).call(this, identifierGenerator, reporter, options);
    this.variableDeclarations_ = [];
    this.ctx_ = id(this.getTempIdentifier());
  }
  return ($__createClass)(AsyncGeneratorTransformer, {
    transformYieldExpression: function(tree) {
      var argList = createArgumentList([tree.expression]);
      if (tree.isYieldFor) {
        return new AwaitExpression(tree.location, new CallExpression(null, createMemberExpression(this.ctx_, 'yieldFor'), argList));
      }
      return new CallExpression(tree.location, createMemberExpression(this.ctx_, 'yield'), argList);
    },
    transformCatch: function(tree) {
      var body = tree.catchBody;
      body = new Block(body.location, $__spread([parseStatement($__getTemplateObject(["\n        if (", ".inReturn) {\n          throw undefined;\n        }"]), this.ctx_)], body.statements));
      return new Catch(tree.location, tree.binding, body);
    },
    transformAsyncGeneratorBody_: function(tree, name) {
      tree = this.transformAny(tree);
      tree = alphaRenameThisAndArguments(this, tree);
      var statements = [];
      if (this.variableDeclarations_.length > 0) {
        statements.push(createVariableStatement(createVariableDeclarationList(VAR, this.variableDeclarations_)));
      }
      var body = createBlock(tree.statements);
      var createAsyncGeneratorInstance = this.getRuntimeExpression('createAsyncGeneratorInstance');
      statements.push(parseStatement($__getTemplateObject(["\n        return ", "(\n            async function (", ") {\n                ", "\n            }, ", ");"]), createAsyncGeneratorInstance, this.ctx_, body, name));
      return createFunctionBody(statements);
    },
    addTempVarForArguments: function() {
      var tmpVarName = this.getTempIdentifier();
      this.variableDeclarations_.push(createVariableDeclaration(tmpVarName, id(ARGUMENTS)));
      return tmpVarName;
    },
    addTempVarForThis: function() {
      var tmpVarName = this.getTempIdentifier();
      this.variableDeclarations_.push(createVariableDeclaration(tmpVarName, createThisExpression()));
      return tmpVarName;
    }
  }, {transformAsyncGeneratorBody: function(identifierGenerator, reporter, options, body, name) {
      return new AsyncGeneratorTransformer(identifierGenerator, reporter, options).transformAsyncGeneratorBody_(body, name);
    }}, $__super);
}(SkipFunctionsTransformerTrait(ImportRuntimeTrait(TempVarTransformer)));
