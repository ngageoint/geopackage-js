"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ModuleTransformer: {
    enumerable: true,
    get: function() {
      return ModuleTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__13 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__13.AnonBlock,
    BindingElement = $__13.BindingElement,
    EmptyStatement = $__13.EmptyStatement,
    LiteralPropertyName = $__13.LiteralPropertyName,
    Module = $__13.Module,
    ObjectPattern = $__13.ObjectPattern,
    ObjectPatternField = $__13.ObjectPatternField,
    Script = $__13.Script;
var DestructuringTransformer = require("./DestructuringTransformer.js").DestructuringTransformer;
var DirectExportVisitor = require("./module/DirectExportVisitor.js").DirectExportVisitor;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var ImportSimplifyingTransformer = require("./ImportSimplifyingTransformer.js").ImportSimplifyingTransformer;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__19 = require("../syntax/trees/ParseTreeType.js"),
    CLASS_DECLARATION = $__19.CLASS_DECLARATION,
    EXPORT_DEFAULT = $__19.EXPORT_DEFAULT,
    EXPORT_SPECIFIER = $__19.EXPORT_SPECIFIER,
    FORWARD_DEFAULT_EXPORT = $__19.FORWARD_DEFAULT_EXPORT,
    FUNCTION_DECLARATION = $__19.FUNCTION_DECLARATION,
    IMPORT_SPECIFIER_SET = $__19.IMPORT_SPECIFIER_SET,
    IMPORT_TYPE_CLAUSE = $__19.IMPORT_TYPE_CLAUSE,
    NAME_SPACE_EXPORT = $__19.NAME_SPACE_EXPORT;
var VAR = require("../syntax/TokenType.js").VAR;
var assert = require("../util/assert.js").assert;
var $__22 = require("../util/url.js"),
    resolveUrl = $__22.resolveUrl,
    canonicalizeUrl = $__22.canonicalizeUrl;
var $__23 = require("./ParseTreeFactory.js"),
    createArgumentList = $__23.createArgumentList,
    createExpressionStatement = $__23.createExpressionStatement,
    createIdentifierExpression = $__23.createIdentifierExpression,
    createIdentifierToken = $__23.createIdentifierToken,
    createMemberExpression = $__23.createMemberExpression,
    createObjectLiteral = $__23.createObjectLiteral,
    createUseStrictDirective = $__23.createUseStrictDirective,
    createVariableStatement = $__23.createVariableStatement,
    createVoid0 = $__23.createVoid0;
var $__24 = require("./PlaceholderParser.js"),
    parseExpression = $__24.parseExpression,
    parsePropertyDefinition = $__24.parsePropertyDefinition,
    parseStatement = $__24.parseStatement,
    parseStatements = $__24.parseStatements;
var SkipFunctionsTransformerTrait = $__interopRequire("./SkipFunctionsTransformerTrait.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var prependStatements = require("./PrependStatements.js").prependStatements;
function removeUseStrictDirectives(tree) {
  var result = tree.scriptItemList.filter(function(tree) {
    return !tree.isUseStrictDirective();
  });
  return new Module(tree.location, result, tree.moduleName);
}
var DestructImportVarStatement = function($__super) {
  function DestructImportVarStatement() {
    $__superConstructor(DestructImportVarStatement).apply(this, arguments);
  }
  return ($__createClass)(DestructImportVarStatement, {createGuardedExpression: function(tree) {
      return tree;
    }}, {}, $__super);
}(DestructuringTransformer);
var ModuleTransformer = function($__super) {
  function ModuleTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(ModuleTransformer).call(this, identifierGenerator, reporter, options);
    this.exportVisitor = new DirectExportVisitor();
    this.importSimplifier_ = new ImportSimplifyingTransformer();
    this.moduleName = null;
  }
  return ($__createClass)(ModuleTransformer, {
    getTempVarNameForModuleName: function(moduleName) {
      return '$__' + moduleName.replace(/[^a-zA-Z0-9$]/g, function(c) {
        return '_' + String(c.charCodeAt(0)) + '_';
      }) + '__';
    },
    getModuleName: function(tree) {
      return tree.moduleName;
    },
    getTempVarNameForModuleSpecifier: function(moduleSpecifier) {
      var name = moduleSpecifier.token.processedValue;
      if (name[0] === '.' && this.moduleName) {
        name = resolveUrl(this.moduleName, name);
      } else {
        name = canonicalizeUrl(name);
      }
      return this.getTempVarNameForModuleName(name);
    },
    transformScript: function(tree) {
      this.moduleName = tree.moduleName;
      return $__superGet(this, ModuleTransformer.prototype, "transformScript").call(this, tree);
    },
    transformModule: function(tree) {
      tree = removeUseStrictDirectives(tree);
      tree = this.importSimplifier_.transformModule(tree);
      var replaceThis = new ReplaceThis();
      tree = replaceThis.transformAny(tree);
      this.moduleName = this.getModuleName(tree);
      this.pushTempScope();
      var statements = this.transformList(tree.scriptItemList);
      statements = this.addExportStatement(statements);
      var runtimeImports = this.transformList(this.getRuntimeImports());
      statements = prependStatements.apply((void 0), $__spread([statements], runtimeImports));
      this.popTempScope();
      statements = this.wrapModule(this.moduleProlog().concat(statements));
      return new Script(tree.location, statements, null);
    },
    moduleProlog: function() {
      var statements = [createUseStrictDirective()];
      if (this.moduleName) {
        statements.push(parseStatement($__getTemplateObject(["var __moduleName = ", ";"]), this.moduleName));
      }
      return statements;
    },
    wrapModule: function(statements) {
      var functionExpression;
      if (this.options.transformOptions.require) {
        functionExpression = parseExpression($__getTemplateObject(["function(require) {\n        ", "\n      }"]), statements);
      } else {
        functionExpression = parseExpression($__getTemplateObject(["function() {\n        ", "\n      }"]), statements);
      }
      if (this.moduleName === null) {
        return parseStatements($__getTemplateObject(["$traceurRuntime.ModuleStore.getAnonymousModule(\n              ", ");"]), functionExpression);
      }
      return parseStatements($__getTemplateObject(["$traceurRuntime.registerModule(", ", [], ", ");"]), this.moduleName, functionExpression);
    },
    getGetterExport: function(exp) {
      var returnExpression = this.getGetterExportReturnExpression(exp);
      return parsePropertyDefinition($__getTemplateObject(["get ", "() { return ", "; }"]), exp.name, returnExpression);
    },
    getGetterExportReturnExpression: function($__4) {
      var $__5 = $__4,
          name = $__5.name,
          tree = $__5.tree,
          moduleSpecifier = $__5.moduleSpecifier;
      var returnExpression;
      switch (tree.type) {
        case EXPORT_DEFAULT:
          switch (tree.expression.type) {
            case CLASS_DECLARATION:
            case FUNCTION_DECLARATION:
              return createIdentifierExpression(tree.expression.name);
            default:
              return createIdentifierExpression('$__default');
          }
          break;
        case EXPORT_SPECIFIER:
          if (moduleSpecifier) {
            var idName = this.getTempVarNameForModuleSpecifier(moduleSpecifier);
            return createMemberExpression(idName, tree.lhs);
          }
          return createIdentifierExpression(tree.lhs);
        case NAME_SPACE_EXPORT:
          {
            var idName$__6 = this.getTempVarNameForModuleSpecifier(moduleSpecifier);
            return createIdentifierExpression(idName$__6);
          }
        case FORWARD_DEFAULT_EXPORT:
          {
            var idName$__7 = this.getTempVarNameForModuleSpecifier(moduleSpecifier);
            return createMemberExpression(idName$__7, 'default');
          }
        default:
          return createIdentifierExpression(name);
      }
    },
    getExportProperties: function() {
      var $__3 = this;
      return this.exportVisitor.getNonTypeNamedExports().map(function(exp) {
        return $__3.getGetterExport(exp);
      }).concat(this.exportVisitor.namedExports.map(function(exp) {
        return $__3.getSetterExport(exp);
      })).filter(function(e) {
        return e;
      });
    },
    getSetterExport: function($__4) {
      var $__5 = $__4,
          name = $__5.name,
          tree = $__5.tree,
          moduleSpecifier = $__5.moduleSpecifier;
      return null;
    },
    getExportObject: function() {
      var exportObject = createObjectLiteral(this.getExportProperties());
      if (this.hasStarExports()) {
        return this.getExportStar(exportObject);
      }
      return exportObject;
    },
    getExportStar: function(exportObject) {
      var $__3 = this;
      var starExports = this.exportVisitor.starExports;
      var starIdents = starExports.map(function(moduleSpecifier) {
        return createIdentifierExpression($__3.getTempVarNameForModuleSpecifier(moduleSpecifier));
      });
      var args = createArgumentList($__spread([exportObject], starIdents));
      var runtime = this.getRuntimeExpression('exportStar');
      return parseExpression($__getTemplateObject(["", "(", ")"]), runtime, args);
    },
    addExportStatement: function(statements) {
      var exportObject = this.getExportObject();
      statements.push(parseStatement($__getTemplateObject(["return ", ""]), exportObject));
      return statements;
    },
    hasExports: function() {
      return this.exportVisitor.hasExports();
    },
    hasStarExports: function() {
      return this.exportVisitor.starExports.length > 0;
    },
    transformExportDeclaration: function(tree) {
      this.exportVisitor.visitAny(tree);
      return this.transformAny(tree.declaration);
    },
    transformExportDefault: function(tree) {
      switch (tree.expression.type) {
        case CLASS_DECLARATION:
        case FUNCTION_DECLARATION:
          return tree.expression;
      }
      return parseStatement($__getTemplateObject(["var $__default = ", ""]), tree.expression);
    },
    transformNamedExport: function(tree) {
      var moduleSpecifier = tree.moduleSpecifier;
      if (moduleSpecifier) {
        var expression = this.transformAny(moduleSpecifier);
        var idName = this.getTempVarNameForModuleSpecifier(moduleSpecifier);
        return createVariableStatement(VAR, idName, expression);
      }
      return new AnonBlock(null, []);
    },
    transformModuleSpecifier: function(tree) {
      assert(this.moduleName);
      var name = tree.token.processedValue;
      return parseExpression($__getTemplateObject(["$traceurRuntime.getModule(\n      $traceurRuntime.normalizeModuleName(", ", ", "));"]), name, this.moduleName);
    },
    transformImportDeclaration: function(tree) {
      if (tree.importClause.type === IMPORT_TYPE_CLAUSE) {
        return new AnonBlock(null, []);
      }
      if (tree.importClause.type === IMPORT_SPECIFIER_SET && tree.importClause.specifiers.length === 0) {
        return createExpressionStatement(this.transformAny(tree.moduleSpecifier));
      }
      var binding = this.transformAny(tree.importClause);
      var initializer = this.transformAny(tree.moduleSpecifier);
      var varStatement = createVariableStatement(VAR, binding, initializer);
      if (this.options.transformOptions.destructuring || !this.options.parseOptions.destructuring) {
        var destructuringTransformer = new DestructImportVarStatement(this.identifierGenerator, this.reporter, this.options);
        varStatement = varStatement.transform(destructuringTransformer);
      }
      return varStatement;
    },
    transformImportSpecifierSet: function(tree) {
      var fields = this.transformList(tree.specifiers);
      return new ObjectPattern(null, fields);
    },
    transformNameSpaceImport: function(tree) {
      return tree.binding.binding;
    },
    transformImportSpecifier: function(tree) {
      var binding = tree.binding.binding;
      var bindingElement = new BindingElement(binding.location, binding, null);
      if (tree.name) {
        var name = new LiteralPropertyName(tree.name.location, tree.name);
        return new ObjectPatternField(tree.location, name, bindingElement);
      }
      return bindingElement;
    }
  }, {}, $__super);
}(ImportRuntimeTrait(TempVarTransformer));
var ReplaceThis = function($__super) {
  function ReplaceThis() {
    $__superConstructor(ReplaceThis).apply(this, arguments);
  }
  return ($__createClass)(ReplaceThis, {transformThisExpression: function(tree) {
      return createVoid0();
    }}, {}, $__super);
}(SkipFunctionsTransformerTrait(ParseTreeTransformer));
