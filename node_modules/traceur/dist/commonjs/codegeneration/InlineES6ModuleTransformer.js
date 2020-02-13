"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  InlineES6ModuleTransformer: {
    enumerable: true,
    get: function() {
      return InlineES6ModuleTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__5 = require("../syntax/TokenType.js"),
    CONST = $__5.CONST,
    LET = $__5.LET;
var ModuleTransformer = require("./ModuleTransformer.js").ModuleTransformer;
var $__7 = require("./ParseTreeFactory.js"),
    createAssignmentStatement = $__7.createAssignmentStatement,
    createArgumentList = $__7.createArgumentList,
    createBindingIdentifier = $__7.createBindingIdentifier,
    createCallExpression = $__7.createCallExpression,
    createExpressionStatement = $__7.createExpressionStatement,
    createForInStatement = $__7.createForInStatement,
    createFunctionBody = $__7.createFunctionBody,
    createIfStatement = $__7.createIfStatement,
    createImmediatelyInvokedFunctionExpression = $__7.createImmediatelyInvokedFunctionExpression,
    createIdentifierExpression = $__7.createIdentifierExpression,
    createMemberLookupExpression = $__7.createMemberLookupExpression,
    createMemberExpression = $__7.createMemberExpression,
    createObjectLiteral = $__7.createObjectLiteral,
    createReturnStatement = $__7.createReturnStatement,
    createUseStrictDirective = $__7.createUseStrictDirective,
    createVariableDeclarationList = $__7.createVariableDeclarationList,
    createVariableStatement = $__7.createVariableStatement;
var IMPORT_SPECIFIER_SET = require("../syntax/trees/ParseTreeType.js").IMPORT_SPECIFIER_SET;
var AnonBlock = require("../syntax/trees/ParseTrees.js").AnonBlock;
var parseStatement = require("./PlaceholderParser.js").parseStatement;
var anonInlineModules = 0;
var InlineES6ModuleTransformer = function($__super) {
  function InlineES6ModuleTransformer(identifierGenerator, reporter, options, metadata) {
    $__superConstructor(InlineES6ModuleTransformer).call(this, identifierGenerator, reporter, options);
    this.metadata_ = metadata;
  }
  return ($__createClass)(InlineES6ModuleTransformer, {
    moduleProlog: function() {
      return [createUseStrictDirective()];
    },
    wrapModule: function(statements) {
      var seed = this.moduleName || 'anon_' + ++anonInlineModules;
      var idName = this.getTempVarNameForModuleName(seed);
      if (this.isRootModule) {
        statements.pop();
        return statements;
      }
      var body = createFunctionBody(statements);
      var moduleExpression = createImmediatelyInvokedFunctionExpression(body);
      return [createVariableStatement(CONST, idName, moduleExpression)];
    },
    transformExportDeclaration: function(tree) {
      if (this.isRootModule)
        return tree;
      this.exportVisitor.visitAny(tree);
      return this.transformAny(tree.declaration);
    },
    transformImportDeclaration: function(tree) {
      if (!tree.importClause || (tree.importClause.type === IMPORT_SPECIFIER_SET && tree.importClause.specifiers.length === 0)) {
        return createExpressionStatement(this.transformAny(tree.moduleSpecifier));
      }
      var binding = this.transformAny(tree.importClause);
      var initializer = this.transformAny(tree.moduleSpecifier);
      return createVariableStatement(CONST, binding, initializer);
    },
    transformNamedExport: function(tree) {
      return new AnonBlock(null, []);
    },
    addExportStatement: function(statements) {
      var $__1 = this;
      var exportProperties = this.getExportProperties();
      var exportObject = createObjectLiteral(exportProperties);
      if (this.exportVisitor.starExports.length) {
        var starExports = this.exportVisitor.starExports;
        var starIdents = starExports.map(function(moduleSpecifier) {
          return createIdentifierExpression($__1.getTempVarNameForModuleSpecifier(moduleSpecifier));
        });
        if (exportProperties.length)
          starIdents.push(exportObject);
        var exports = this.getTempIdentifier();
        statements.push(createVariableStatement(LET, exports, createObjectLiteral("")));
        var key = this.getTempIdentifier();
        starIdents.forEach(function(starIdent) {
          statements.push(createForInStatement(createVariableDeclarationList(LET, key, null), starIdent, createIfStatement(createCallExpression(createMemberExpression(starIdent, 'hasOwnProperty'), createArgumentList([createIdentifierExpression(key)])), createAssignmentStatement(createMemberLookupExpression(createIdentifierExpression(exports), createIdentifierExpression(key)), createMemberLookupExpression(starIdent, createIdentifierExpression(key))))));
        });
        statements.push(createReturnStatement(createIdentifierExpression(exports)));
        return statements;
      }
      statements.push(parseStatement($__getTemplateObject(["return ", ""]), exportObject));
      return statements;
    },
    transformModuleSpecifier: function(tree) {
      return createBindingIdentifier(this.getTempVarNameForModuleSpecifier(tree));
    },
    get isRootModule() {
      return this.moduleName === (this.metadata_ && this.metadata_.rootModule);
    }
  }, {}, $__super);
}(ModuleTransformer);
