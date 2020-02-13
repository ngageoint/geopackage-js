"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FnExtractAbruptCompletions: {
    enumerable: true,
    get: function() {
      return FnExtractAbruptCompletions;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var alphaRenameThisAndArguments = $__interopRequire("./alphaRenameThisAndArguments.js").default;
var parseStatement = require("./PlaceholderParser.js").parseStatement;
var $__10 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__10.AnonBlock,
    BreakStatement = $__10.BreakStatement,
    ContinueStatement = $__10.ContinueStatement,
    FormalParameterList = $__10.FormalParameterList,
    FunctionExpression = $__10.FunctionExpression,
    ReturnStatement = $__10.ReturnStatement,
    YieldExpression = $__10.YieldExpression;
var $__11 = require("./ParseTreeFactory.js"),
    createArgumentList = $__11.createArgumentList,
    createAssignmentStatement = $__11.createAssignmentStatement,
    createAssignmentExpression = $__11.createAssignmentExpression,
    createBlock = $__11.createBlock,
    createCallExpression = $__11.createCallExpression,
    createCaseClause = $__11.createCaseClause,
    createDefaultClause = $__11.createDefaultClause,
    createExpressionStatement = $__11.createExpressionStatement,
    createFunctionBody = $__11.createFunctionBody,
    createFunctionExpression = $__11.createFunctionExpression,
    createIdentifierExpression = $__11.createIdentifierExpression,
    createNumberLiteral = $__11.createNumberLiteral,
    createObjectLiteralForDescriptor = $__11.createObjectLiteralForDescriptor,
    createSwitchStatement = $__11.createSwitchStatement,
    createThisExpression = $__11.createThisExpression,
    createVariableDeclaration = $__11.createVariableDeclaration,
    createVariableDeclarationList = $__11.createVariableDeclarationList,
    createVariableStatement = $__11.createVariableStatement,
    createVoid0 = $__11.createVoid0;
var ARGUMENTS = require("../syntax/PredefinedName.js").ARGUMENTS;
var SkipFunctionsTransformerTrait = $__interopRequire("./SkipFunctionsTransformerTrait.js").default;
var StringSet = require("../util/StringSet.js").StringSet;
var Token = require("../syntax/Token.js").Token;
var $__16 = require("../syntax/TokenType.js"),
    STAR = $__16.STAR,
    VAR = $__16.VAR;
var FnExtractAbruptCompletions = function($__super) {
  function FnExtractAbruptCompletions(idGenerator, requestParentLabel) {
    $__superConstructor(FnExtractAbruptCompletions).call(this);
    this.idGenerator_ = idGenerator;
    this.inLoop_ = 0;
    this.inBreakble_ = 0;
    this.variableDeclarations_ = [];
    this.extractedStatements_ = [];
    this.requestParentLabel_ = requestParentLabel;
    this.labelledStatements_ = new StringSet();
  }
  return ($__createClass)(FnExtractAbruptCompletions, {
    createIIFE: function(body, paramList, argsList, inGenerator) {
      body = this.transformAny(body);
      body = alphaRenameThisAndArguments(this, body);
      var tmpFnName = this.idGenerator_.generateUniqueIdentifier();
      var functionKind = inGenerator ? new Token(STAR, null) : null;
      var functionExpression = new FunctionExpression(null, null, functionKind, new FormalParameterList(null, paramList), null, [], createFunctionBody(body.statements || [body]));
      this.variableDeclarations_.push(createVariableDeclaration(tmpFnName, functionExpression));
      var functionCall = createCallExpression(createIdentifierExpression(tmpFnName), createArgumentList(argsList));
      if (inGenerator) {
        functionCall = new YieldExpression(null, functionCall, true);
      }
      var loopBody = null;
      if (this.extractedStatements_.length || this.hasReturns) {
        var tmpVarName = createIdentifierExpression(this.idGenerator_.generateUniqueIdentifier());
        this.variableDeclarations_.push(createVariableDeclaration(tmpVarName, null));
        var maybeReturn;
        if (this.hasReturns) {
          maybeReturn = parseStatement($__getTemplateObject(["if (typeof ", " === \"object\")\n            return ", ".v;"]), tmpVarName, tmpVarName);
        }
        if (this.extractedStatements_.length) {
          var caseClauses = this.extractedStatements_.map(function(statement, index) {
            return createCaseClause(createNumberLiteral(index), [statement]);
          });
          if (maybeReturn) {
            caseClauses.push(createDefaultClause([maybeReturn]));
          }
          loopBody = createBlock([createExpressionStatement(createAssignmentExpression(tmpVarName, functionCall)), createSwitchStatement(tmpVarName, caseClauses)]);
        } else {
          loopBody = createBlock([createExpressionStatement(createAssignmentExpression(tmpVarName, functionCall)), maybeReturn]);
        }
      } else {
        loopBody = createBlock([createExpressionStatement(functionCall)]);
      }
      return {
        variableStatements: createVariableStatement(createVariableDeclarationList(VAR, this.variableDeclarations_)),
        loopBody: loopBody
      };
    },
    addTempVarForArguments: function() {
      var tmpVarName = this.idGenerator_.generateUniqueIdentifier();
      this.variableDeclarations_.push(createVariableDeclaration(tmpVarName, createIdentifierExpression(ARGUMENTS)));
      return tmpVarName;
    },
    addTempVarForThis: function() {
      var tmpVarName = this.idGenerator_.generateUniqueIdentifier();
      this.variableDeclarations_.push(createVariableDeclaration(tmpVarName, createThisExpression()));
      return tmpVarName;
    },
    transformAny: function(tree) {
      if (tree) {
        if (tree.isBreakableStatement())
          this.inBreakble_++;
        if (tree.isIterationStatement())
          this.inLoop_++;
        tree = $__superGet(this, FnExtractAbruptCompletions.prototype, "transformAny").call(this, tree);
        if (tree.isBreakableStatement())
          this.inBreakble_--;
        if (tree.isIterationStatement())
          this.inLoop_--;
      }
      return tree;
    },
    transformReturnStatement: function(tree) {
      this.hasReturns = true;
      return new ReturnStatement(tree.location, createObjectLiteralForDescriptor({v: tree.expression || createVoid0()}));
    },
    transformAbruptCompletion_: function(tree) {
      this.extractedStatements_.push(tree);
      var index = this.extractedStatements_.length - 1;
      return parseStatement($__getTemplateObject(["return ", ";"]), index);
    },
    transformBreakStatement: function(tree) {
      if (!tree.name) {
        if (this.inBreakble_) {
          return $__superGet(this, FnExtractAbruptCompletions.prototype, "transformBreakStatement").call(this, tree);
        } else {
          tree = new BreakStatement(tree.location, this.requestParentLabel_());
        }
      } else if (this.labelledStatements_.has(tree.name.value)) {
        return $__superGet(this, FnExtractAbruptCompletions.prototype, "transformBreakStatement").call(this, tree);
      }
      return this.transformAbruptCompletion_(tree);
    },
    transformContinueStatement: function(tree) {
      if (!tree.name) {
        if (this.inLoop_) {
          return $__superGet(this, FnExtractAbruptCompletions.prototype, "transformContinueStatement").call(this, tree);
        } else {
          tree = new ContinueStatement(tree.location, this.requestParentLabel_());
        }
      } else if (this.labelledStatements_.has(tree.name.value)) {
        return $__superGet(this, FnExtractAbruptCompletions.prototype, "transformContinueStatement").call(this, tree);
      }
      return this.transformAbruptCompletion_(tree);
    },
    transformLabelledStatement: function(tree) {
      this.labelledStatements_.add(tree.name.value);
      return $__superGet(this, FnExtractAbruptCompletions.prototype, "transformLabelledStatement").call(this, tree);
    },
    transformVariableStatement: function(tree) {
      var $__2 = this;
      if (tree.declarations.declarationType === VAR) {
        var assignments = [];
        tree.declarations.declarations.forEach(function(variableDeclaration) {
          var variableName = variableDeclaration.lvalue.getStringValue();
          var initializer = $__superGet($__2, FnExtractAbruptCompletions.prototype, "transformAny").call($__2, variableDeclaration.initializer);
          $__2.variableDeclarations_.push(createVariableDeclaration(variableName, null));
          assignments.push(createAssignmentStatement(createIdentifierExpression(variableName), initializer));
        });
        return new AnonBlock(null, assignments);
      }
      return $__superGet(this, FnExtractAbruptCompletions.prototype, "transformVariableStatement").call(this, tree);
    }
  }, {createIIFE: function(idGenerator, body, paramList, argsList, requestParentLabel, inGenerator) {
      return new FnExtractAbruptCompletions(idGenerator, requestParentLabel).createIIFE(body, paramList, argsList, inGenerator);
    }}, $__super);
}(SkipFunctionsTransformerTrait(ParseTreeTransformer));
