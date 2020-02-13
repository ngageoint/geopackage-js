"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  InnerForOnTransformer: {
    enumerable: true,
    get: function() {
      return InnerForOnTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var alphaRenameThisAndArguments = $__interopRequire("./alphaRenameThisAndArguments.js").default;
var $__9 = require("./PlaceholderParser.js"),
    parseStatement = $__9.parseStatement,
    parseStatements = $__9.parseStatements;
var $__10 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__10.AnonBlock,
    Block = $__10.Block,
    ContinueStatement = $__10.ContinueStatement,
    LabelledStatement = $__10.LabelledStatement,
    ReturnStatement = $__10.ReturnStatement;
var StringSet = require("../util/StringSet.js").StringSet;
var $__12 = require("./ParseTreeFactory.js"),
    createAssignmentStatement = $__12.createAssignmentStatement,
    createCaseClause = $__12.createCaseClause,
    createDefaultClause = $__12.createDefaultClause,
    id = $__12.createIdentifierExpression,
    createNumberLiteral = $__12.createNumberLiteral,
    createSwitchStatement = $__12.createSwitchStatement,
    createThisExpression = $__12.createThisExpression,
    createVariableStatement = $__12.createVariableStatement,
    createVariableDeclaration = $__12.createVariableDeclaration,
    createVariableDeclarationList = $__12.createVariableDeclarationList,
    createVoid0 = $__12.createVoid0;
var SkipFunctionsTransformerTrait = $__interopRequire("./SkipFunctionsTransformerTrait.js").default;
var ARGUMENTS = require("../syntax/PredefinedName.js").ARGUMENTS;
var VAR = require("../syntax/TokenType.js").VAR;
var $__16 = require("../syntax/trees/ParseTreeType.js"),
    VARIABLE_DECLARATION_LIST = $__16.VARIABLE_DECLARATION_LIST,
    BLOCK = $__16.BLOCK;
var InnerForOnTransformer = function($__super) {
  function InnerForOnTransformer(tempIdGenerator, labelSet, options) {
    var $__1;
    $__superConstructor(InnerForOnTransformer).call(this);
    this.idGenerator_ = tempIdGenerator;
    this.inLoop_ = 0;
    this.inBreakble_ = 0;
    this.variableDeclarations_ = [];
    this.extractedStatements_ = [];
    this.labelSet_ = labelSet;
    this.labelledStatements_ = new StringSet();
    this.observer_ = id(this.idGenerator_.getTempIdentifier());
    this.result_ = id(this.idGenerator_.getTempIdentifier());
    this.parentLabels_ = new StringSet();
    this.labelSet_.forEach(($__1 = this, function(tree) {
      $__1.parentLabels_.add(tree.name.value);
    }));
    this.options = options;
  }
  return ($__createClass)(InnerForOnTransformer, {
    transform: function(tree) {
      var value = id(this.idGenerator_.getTempIdentifier());
      var assignment;
      if (tree.initializer.type === VARIABLE_DECLARATION_LIST) {
        assignment = createVariableStatement(tree.initializer.declarationType, tree.initializer.declarations[0].lvalue, value);
      } else {
        assignment = parseStatement($__getTemplateObject(["\n          ", " = ", ";"]), tree.initializer, value);
      }
      var body;
      if (tree.body.type === BLOCK) {
        body = new Block(tree.body.location, $__spread([assignment], tree.body.statements));
      } else {
        body = new Block(null, [assignment, tree.body]);
      }
      body = this.transformAny(body);
      body = alphaRenameThisAndArguments(this, body);
      this.variableDeclarations_.push(createVariableDeclaration(this.result_, createVoid0()));
      var caseClauses = this.extractedStatements_.map(function(statement, index) {
        return createCaseClause(createNumberLiteral(index), [statement]);
      });
      caseClauses.push(createCaseClause(createVoid0(), [new ContinueStatement(null, null)]));
      caseClauses.push(createDefaultClause(parseStatements($__getTemplateObject(["\n        return ", ".v;"]), this.result_)));
      var switchStatement = createSwitchStatement(this.result_, caseClauses);
      var observeForEach = this.idGenerator_.getRuntimeExpression('observeForEach');
      var statement = parseStatement($__getTemplateObject(["\n        do {\n          ", "\n            await ", "(\n              ", "[Symbol.observer].bind(", "),\n              async function (", ") {\n                var ", " = this;\n                try {\n                  ", "\n                } catch (e) {\n                  ", ".throw(e);\n                }\n              });\n          ", "\n        } while (false);"]), createVariableStatement(createVariableDeclarationList(VAR, this.variableDeclarations_)), observeForEach, tree.observable, tree.observable, value, this.observer_, body, this.observer_, switchStatement);
      var labelledStatement;
      while (labelledStatement = this.labelSet_.pop()) {
        statement = new LabelledStatement(labelledStatement.location, labelledStatement.name, statement);
      }
      return statement;
    },
    addTempVarForArguments: function() {
      var tmpVarName = this.idGenerator_.generateUniqueIdentifier();
      this.variableDeclarations_.push(createVariableDeclaration(tmpVarName, id(ARGUMENTS)));
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
        tree = $__superGet(this, InnerForOnTransformer.prototype, "transformAny").call(this, tree);
        if (tree.isBreakableStatement())
          this.inBreakble_--;
        if (tree.isIterationStatement())
          this.inLoop_--;
      }
      return tree;
    },
    transformReturnStatement: function(tree) {
      return new AnonBlock(tree.location, parseStatements($__getTemplateObject(["\n        ", ".return();\n        ", " = {v: ", "};\n        return;"]), this.observer_, this.result_, (tree.expression || createVoid0())));
    },
    transformAbruptCompletion_: function(tree) {
      this.extractedStatements_.push(tree);
      var index = this.extractedStatements_.length - 1;
      return new AnonBlock(null, parseStatements($__getTemplateObject(["\n        ", ".return();\n        ", " = ", ";\n        return;"]), this.observer_, this.result_, index));
    },
    transformBreakStatement: function(tree) {
      if (!tree.name) {
        if (this.inBreakble_) {
          return $__superGet(this, InnerForOnTransformer.prototype, "transformBreakStatement").call(this, tree);
        }
        return this.transformAbruptCompletion_(new ContinueStatement(tree.location, null));
      }
      if (this.labelledStatements_.has(tree.name.value)) {
        return $__superGet(this, InnerForOnTransformer.prototype, "transformBreakStatement").call(this, tree);
      }
      return this.transformAbruptCompletion_(tree);
    },
    transformContinueStatement: function(tree) {
      if (!tree.name) {
        if (this.inLoop_) {
          return $__superGet(this, InnerForOnTransformer.prototype, "transformContinueStatement").call(this, tree);
        }
        return new ReturnStatement(tree.location, null);
      }
      if (this.labelledStatements_.has(tree.name.value)) {
        return $__superGet(this, InnerForOnTransformer.prototype, "transformContinueStatement").call(this, tree);
      }
      if (this.parentLabels_.has(tree.name.value)) {
        return new ReturnStatement(tree.location, null);
      }
      return this.transformAbruptCompletion_(tree);
    },
    transformLabelledStatement: function(tree) {
      this.labelledStatements_.add(tree.name.value);
      return $__superGet(this, InnerForOnTransformer.prototype, "transformLabelledStatement").call(this, tree);
    },
    transformVariableStatement: function(tree) {
      var $__1 = this;
      if (tree.declarations.declarationType === VAR) {
        var assignments = [];
        tree.declarations.declarations.forEach(function(variableDeclaration) {
          var variableName = variableDeclaration.lvalue.getStringValue();
          var initializer = $__superGet($__1, InnerForOnTransformer.prototype, "transformAny").call($__1, variableDeclaration.initializer);
          $__1.variableDeclarations_.push(createVariableDeclaration(variableName, null));
          assignments.push(createAssignmentStatement(id(variableName), initializer));
        });
        return new AnonBlock(null, assignments);
      }
      return $__superGet(this, InnerForOnTransformer.prototype, "transformVariableStatement").call(this, tree);
    }
  }, {transform: function(tempIdGenerator, tree, labelSet) {
      return new InnerForOnTransformer(tempIdGenerator, labelSet).transform(tree);
    }}, $__super);
}(SkipFunctionsTransformerTrait(ParseTreeTransformer));
