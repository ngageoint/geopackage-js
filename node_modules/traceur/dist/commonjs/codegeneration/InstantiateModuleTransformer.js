"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  InstantiateModuleTransformer: {
    enumerable: true,
    get: function() {
      return InstantiateModuleTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__15 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__15.AnonBlock,
    ArrayLiteral = $__15.ArrayLiteral,
    ClassExpression = $__15.ClassExpression,
    CommaExpression = $__15.CommaExpression,
    ExpressionStatement = $__15.ExpressionStatement,
    VariableDeclaration = $__15.VariableDeclaration;
var $__16 = require("../syntax/trees/ParseTreeType.js"),
    ANON_BLOCK = $__16.ANON_BLOCK,
    CLASS_DECLARATION = $__16.CLASS_DECLARATION,
    FUNCTION_DECLARATION = $__16.FUNCTION_DECLARATION,
    IDENTIFIER_EXPRESSION = $__16.IDENTIFIER_EXPRESSION,
    IMPORT_SPECIFIER_SET = $__16.IMPORT_SPECIFIER_SET,
    NAME_SPACE_IMPORT = $__16.NAME_SPACE_IMPORT;
var ParseTreeVisitor = require("../syntax/ParseTreeVisitor.js").ParseTreeVisitor;
var ScopeTransformer = require("./ScopeTransformer.js").ScopeTransformer;
var $__19 = require("./ParseTreeFactory.js"),
    createEmptyParameterList = $__19.createEmptyParameterList,
    createFunctionBody = $__19.createFunctionBody,
    createFunctionExpression = $__19.createFunctionExpression,
    id = $__19.createIdentifierExpression,
    createObjectLiteralForDescriptor = $__19.createObjectLiteralForDescriptor,
    createUseStrictDirective = $__19.createUseStrictDirective,
    createVariableDeclarationList = $__19.createVariableDeclarationList,
    createVariableStatement = $__19.createVariableStatement;
var ModuleTransformer = require("./ModuleTransformer.js").ModuleTransformer;
var $__21 = require("../syntax/TokenType.js"),
    MINUS_MINUS = $__21.MINUS_MINUS,
    PLUS_PLUS = $__21.PLUS_PLUS,
    VAR = $__21.VAR;
var $__22 = require("./PlaceholderParser.js"),
    parseExpression = $__22.parseExpression,
    parseStatement = $__22.parseStatement,
    parseStatements = $__22.parseStatements;
var HoistVariablesTransformer = $__interopRequire("./HoistVariablesTransformer.js").default;
function flattenAnonBlocks(statements) {
  var $__9;
  var result = [];
  for (var i = 0; i < statements.length; i++) {
    var statement = statements[i];
    if (statement.type === ANON_BLOCK) {
      ($__9 = result).push.apply($__9, $__spread(statement.statements));
    } else {
      result.push(statement);
    }
  }
  return result;
}
var ExportBindingsVisitor = function($__super) {
  function ExportBindingsVisitor() {
    $__superConstructor(ExportBindingsVisitor).call(this);
    this.bindings = [];
  }
  return ($__createClass)(ExportBindingsVisitor, {
    visitVariableDeclaration: function(tree) {
      this.visitAny(tree.lvalue);
    },
    visitBindingIdentifier: function(tree) {
      this.bindings.push(tree);
    },
    visitBindingElement: function(tree) {
      this.visitAny(tree.binding);
    }
  }, {}, $__super);
}(ParseTreeVisitor);
var DeclarationExtractionTransformer = function($__super) {
  function DeclarationExtractionTransformer() {
    $__superConstructor(DeclarationExtractionTransformer).call(this);
    this.declarations_ = [];
  }
  return ($__createClass)(DeclarationExtractionTransformer, {
    getDeclarationStatements: function() {
      return flattenAnonBlocks($__spread([this.getVariableStatement()], this.declarations_));
    },
    addDeclaration: function(tree) {
      this.declarations_.push(tree);
    },
    transformFunctionDeclaration: function(tree) {
      this.addDeclaration(tree);
      return new AnonBlock(null, []);
    },
    transformClassDeclaration: function(tree) {
      this.addVariable(tree.name.identifierToken.value);
      tree = new ClassExpression(tree.location, tree.name, tree.superClass, tree.elements, tree.annotations, tree.typeParameters);
      return parseStatement($__getTemplateObject(["", " = ", ""]), tree.name.identifierToken, tree);
    }
  }, {}, $__super);
}(HoistVariablesTransformer);
var ModuleNameIdentifierTransformer = function($__super) {
  function ModuleNameIdentifierTransformer() {
    $__superConstructor(ModuleNameIdentifierTransformer).call(this, '__moduleName');
    this.usesModuleName = false;
  }
  return ($__createClass)(ModuleNameIdentifierTransformer, {transformIdentifierExpression: function(tree) {
      if (tree.identifierToken.value === '__moduleName') {
        this.usesModuleName = true;
        return parseExpression($__getTemplateObject(["$__moduleContext.id"]));
      }
      return $__superGet(this, ModuleNameIdentifierTransformer.prototype, "transformIdentifierExpression").call(this, tree);
    }}, {}, $__super);
}(ScopeTransformer);
var InsertBindingAssignmentTransformer = function($__super) {
  function InsertBindingAssignmentTransformer(exportName, bindingName) {
    $__superConstructor(InsertBindingAssignmentTransformer).call(this, bindingName);
    this.bindingName_ = bindingName;
    this.exportName_ = exportName;
  }
  return ($__createClass)(InsertBindingAssignmentTransformer, {
    matchesBindingName_: function(binding) {
      return binding.type === IDENTIFIER_EXPRESSION && binding.identifierToken.value === this.bindingName_;
    },
    transformUnaryExpression: function(tree) {
      if (!this.matchesBindingName_(tree.operand))
        return $__superGet(this, InsertBindingAssignmentTransformer.prototype, "transformUnaryExpression").call(this, tree);
      var operatorType = tree.operator.type;
      if (operatorType !== PLUS_PLUS && operatorType !== MINUS_MINUS)
        return $__superGet(this, InsertBindingAssignmentTransformer.prototype, "transformUnaryExpression").call(this, tree);
      var operand = this.transformAny(tree.operand);
      if (operand !== tree.operand)
        tree = new UnaryExpression(tree.location, tree.operator, operand);
      return parseExpression($__getTemplateObject(["$__export(", ", ", ")"]), this.exportName_, tree);
    },
    transformPostfixExpression: function(tree) {
      tree = $__superGet(this, InsertBindingAssignmentTransformer.prototype, "transformPostfixExpression").call(this, tree);
      if (!this.matchesBindingName_(tree.operand))
        return tree;
      switch (tree.operator.type) {
        case PLUS_PLUS:
          return parseExpression($__getTemplateObject(["($__export(", ", ", " + 1), ", ")"]), this.exportName_, tree.operand, tree);
        case MINUS_MINUS:
          return parseExpression($__getTemplateObject(["($__export(", ", ", " - 1), ", ")"]), this.exportName_, tree.operand, tree);
      }
      return tree;
    },
    transformBinaryExpression: function(tree) {
      tree = $__superGet(this, InsertBindingAssignmentTransformer.prototype, "transformBinaryExpression").call(this, tree);
      if (!tree.operator.isAssignmentOperator())
        return tree;
      if (!this.matchesBindingName_(tree.left))
        return tree;
      return parseExpression($__getTemplateObject(["$__export(", ", ", ")}"]), this.exportName_, tree);
    }
  }, {}, $__super);
}(ScopeTransformer);
var InstantiateModuleTransformer = function($__super) {
  function InstantiateModuleTransformer(identifierGenerator, reporter) {
    var options = arguments[2];
    $__superConstructor(InstantiateModuleTransformer).call(this, identifierGenerator, reporter, options);
    this.anonymousModule = options && !options.bundle && options.moduleName !== true;
    this.usesModuleName = false;
    this.inExport_ = false;
    this.curDepIndex_ = null;
    this.dependencies = [];
    this.externalExportBindings = [];
    this.importBindings = [];
    this.localExportBindings = [];
    this.functionDeclarations = [];
    this.moduleBindings = [];
    this.exportStarBindings = [];
  }
  return ($__createClass)(InstantiateModuleTransformer, {
    getModuleName: function(tree) {
      if (this.anonymousModule)
        return null;
      return tree.moduleName;
    },
    moduleProlog: function() {
      return [];
    },
    wrapModule: function(statements) {
      var prolog = [createUseStrictDirective()];
      statements = prolog.concat(statements);
      if (this.usesModuleName) {
        if (this.moduleName) {
          return parseStatements($__getTemplateObject(["System.register(", ",\n            ", ", function($__export, $__moduleContext) {\n              ", "\n            });"]), this.moduleName, this.dependencies, statements);
        }
        return parseStatements($__getTemplateObject(["System.register(", ", function($__export, $__moduleContext) {\n            ", "\n          });"]), this.dependencies, statements);
      }
      if (this.moduleName) {
        return parseStatements($__getTemplateObject(["System.register(", ",\n          ", ", function($__export) {\n            ", "\n          });"]), this.moduleName, this.dependencies, statements);
      }
      return parseStatements($__getTemplateObject(["System.register(", ", function($__export) {\n          ", "\n        });"]), this.dependencies, statements);
    },
    addExportStatement: function(statements) {
      var $__6 = this;
      var declarationExtractionTransformer = new DeclarationExtractionTransformer();
      var moduleNameIdentifierTransformer = new ModuleNameIdentifierTransformer();
      statements = moduleNameIdentifierTransformer.transformList(statements);
      if (moduleNameIdentifierTransformer.usesModuleName)
        this.usesModuleName = true;
      this.localExportBindings.forEach(function(binding) {
        statements = new InsertBindingAssignmentTransformer(binding.exportName, binding.localName).transformList(statements);
      });
      var executionStatements = declarationExtractionTransformer.transformList(statements);
      var executionFunction = createFunctionExpression(createEmptyParameterList(), createFunctionBody(executionStatements));
      var declarationStatements = declarationExtractionTransformer.getDeclarationStatements();
      var setterFunctions = this.dependencies.map(function(dep, index) {
        var importBindings = $__6.importBindings[index];
        var externalExportBindings = $__6.externalExportBindings[index];
        var exportStarBinding = $__6.exportStarBindings[index];
        var moduleBinding = $__6.moduleBindings[index];
        var setterStatements = [];
        if (importBindings) {
          importBindings.forEach(function(binding) {
            setterStatements.push(parseStatement($__getTemplateObject(["", " = $__m.", ";"]), id(binding.variableName), binding.exportName));
          });
        }
        if (externalExportBindings) {
          var reexports = Object.create(null);
          externalExportBindings.forEach(function($__7) {
            var $__8 = $__7,
                exportName = $__8.exportName,
                importName = $__8.importName;
            reexports[exportName] = importName === null ? parseExpression($__getTemplateObject(["$__m"])) : parseExpression($__getTemplateObject(["$__m.", ""]), importName);
          });
          setterStatements.push(parseStatement($__getTemplateObject(["$__export(", ")"]), createObjectLiteralForDescriptor(reexports)));
        }
        if (moduleBinding) {
          setterStatements.push(parseStatement($__getTemplateObject(["", " = $__m;"]), id(moduleBinding)));
        }
        if (exportStarBinding) {
          setterStatements = setterStatements.concat(parseStatements($__getTemplateObject(["\n          var exportObj = Object.create(null);\n          Object.keys($__m).forEach(function(p) {\n            if (p !== 'default' && !$__exportNames[p])\n              exportObj[p] = $__m[p];\n          });\n          $__export(exportObj);\n        "])));
          var exportNames = {};
          $__6.localExportBindings.concat($__6.externalExportBindings).forEach(function(binding) {
            exportNames[binding.exportName] = true;
          });
          declarationStatements.push(parseStatement($__getTemplateObject(["\n          var $__exportNames = ", ";\n        "]), createObjectLiteralForDescriptor(exportNames)));
        }
        if (setterStatements.length) {
          return parseExpression($__getTemplateObject(["function($__m) {\n          ", "\n        }"]), setterStatements);
        }
        return parseExpression($__getTemplateObject(["function($__m) {}"]));
      });
      declarationStatements = declarationStatements.concat(this.functionDeclarations.map(function(binding) {
        return parseStatement($__getTemplateObject(["$__export(", ", ", ")"]), binding.exportName, id(binding.functionName));
      }));
      declarationStatements.push(parseStatement($__getTemplateObject(["return {\n      setters: ", ",\n      execute: ", "\n    }"]), new ArrayLiteral(null, setterFunctions), executionFunction));
      return declarationStatements;
    },
    addLocalExportBinding: function(exportName) {
      var localName = arguments[1] !== (void 0) ? arguments[1] : exportName;
      this.localExportBindings.push({
        exportName: exportName,
        localName: localName
      });
    },
    addImportBinding: function(depIndex, variableName, exportName) {
      this.importBindings[depIndex] = this.importBindings[depIndex] || [];
      this.importBindings[depIndex].push({
        variableName: variableName,
        exportName: exportName
      });
    },
    addExternalExportBinding: function(depIndex, exportName, importName) {
      this.externalExportBindings[depIndex] = this.externalExportBindings[depIndex] || [];
      this.externalExportBindings[depIndex].push({
        exportName: exportName,
        importName: importName
      });
    },
    addExportStarBinding: function(depIndex) {
      this.exportStarBindings[depIndex] = true;
    },
    addModuleBinding: function(depIndex, variableName) {
      this.moduleBindings[depIndex] = variableName;
    },
    addExportFunction: function(exportName) {
      var functionName = arguments[1] !== (void 0) ? arguments[1] : exportName;
      this.functionDeclarations.push({
        exportName: exportName,
        functionName: functionName
      });
    },
    getOrCreateDependencyIndex: function(moduleSpecifier) {
      var name = moduleSpecifier.token.processedValue;
      var depIndex = this.dependencies.indexOf(name);
      if (depIndex === -1) {
        depIndex = this.dependencies.length;
        this.dependencies.push(name);
      }
      return depIndex;
    },
    transformExportDeclaration: function(tree) {
      this.inExport_ = true;
      if (tree.declaration.moduleSpecifier) {
        this.curDepIndex_ = this.getOrCreateDependencyIndex(tree.declaration.moduleSpecifier);
      } else {
        this.curDepIndex_ = null;
      }
      var transformed = this.transformAny(tree.declaration);
      this.inExport_ = false;
      return transformed;
    },
    transformVariableStatement: function(tree) {
      if (!this.inExport_)
        return $__superGet(this, InstantiateModuleTransformer.prototype, "transformVariableStatement").call(this, tree);
      this.inExport_ = false;
      var bindingVisitor = new ExportBindingsVisitor();
      bindingVisitor.visitAny(tree);
      var statements = [];
      for (var i = 0; i < bindingVisitor.bindings.length; i++) {
        var identifierToken = bindingVisitor.bindings[i].identifierToken;
        var name = identifierToken.value;
        this.addLocalExportBinding(name);
        statements.push(parseStatement($__getTemplateObject(["$__export(", ", ", ")"]), name, id(identifierToken)));
      }
      statements.unshift($__superGet(this, InstantiateModuleTransformer.prototype, "transformAny").call(this, tree));
      return new AnonBlock(null, statements);
    },
    transformExportStar: function(tree) {
      this.inExport_ = false;
      this.addExportStarBinding(this.curDepIndex_);
      return new AnonBlock(null, []);
    },
    transformClassDeclaration: function(tree) {
      if (!this.inExport_)
        return $__superGet(this, InstantiateModuleTransformer.prototype, "transformClassDeclaration").call(this, tree);
      this.inExport_ = false;
      var identifierToken = tree.name.identifierToken;
      var name = identifierToken.value;
      this.addLocalExportBinding(name);
      var statements = [$__superGet(this, InstantiateModuleTransformer.prototype, "transformClassDeclaration").call(this, tree), parseStatement($__getTemplateObject(["$__export(", ", ", ")"]), name, id(identifierToken))];
      return new AnonBlock(null, statements);
    },
    transformFunctionDeclaration: function(tree) {
      if (this.inExport_) {
        var name = tree.name.getStringValue();
        this.addLocalExportBinding(name);
        this.addExportFunction(name);
        this.inExport_ = false;
      }
      return $__superGet(this, InstantiateModuleTransformer.prototype, "transformFunctionDeclaration").call(this, tree);
    },
    transformNamedExport: function(tree) {
      this.transformAny(tree.moduleSpecifier);
      var exportClause = this.transformAny(tree.exportClause);
      if (this.curDepIndex_ === null) {
        return exportClause;
      }
      return new AnonBlock(null, []);
    },
    transformImportDeclaration: function(tree) {
      this.curDepIndex_ = this.getOrCreateDependencyIndex(tree.moduleSpecifier);
      var initializer = this.transformAny(tree.moduleSpecifier);
      if (!tree.importClause) {
        return new AnonBlock(null, []);
      }
      var importClause = this.transformAny(tree.importClause);
      if (tree.importClause.type === NAME_SPACE_IMPORT) {
        var bindingIdentifier = tree.importClause.binding.binding;
        var name = bindingIdentifier.getStringValue();
        this.addModuleBinding(this.curDepIndex_, name);
        return parseStatement($__getTemplateObject(["var ", ";"]), bindingIdentifier);
      }
      if (tree.importClause.type === IMPORT_SPECIFIER_SET) {
        return importClause;
      }
      var bindingName = tree.importClause.binding.getStringValue();
      this.addImportBinding(this.curDepIndex_, bindingName, 'default');
      return parseStatement($__getTemplateObject(["var ", ";"]), bindingName);
    },
    transformImportSpecifierSet: function(tree) {
      return createVariableStatement(createVariableDeclarationList(VAR, this.transformList(tree.specifiers)));
    },
    transformExportDefault: function(tree) {
      this.inExport_ = false;
      var expression = this.transformAny(tree.expression);
      this.addLocalExportBinding('default');
      if (expression.type === CLASS_DECLARATION) {
        expression = new ClassExpression(expression.location, expression.name, expression.superClass, expression.elements, expression.annotations, expression.typeParameters);
      }
      if (expression.type === FUNCTION_DECLARATION) {
        this.addExportFunction('default', expression.name.identifierToken.value);
        return expression;
      } else {
        return parseStatement($__getTemplateObject(["$__export('default', ", ");"]), expression);
      }
    },
    transformExportSpecifier: function(tree) {
      var exportName;
      var bindingName;
      if (tree.rhs) {
        exportName = tree.rhs.value;
        bindingName = tree.lhs.value;
      } else {
        exportName = tree.lhs.value;
        bindingName = exportName;
      }
      if (this.curDepIndex_ !== null) {
        this.addExternalExportBinding(this.curDepIndex_, exportName, bindingName);
      } else {
        this.addLocalExportBinding(exportName, bindingName);
        return parseExpression($__getTemplateObject(["$__export(", ", ", ");"]), exportName, id(bindingName));
      }
    },
    transformExportSpecifierSet: function(tree) {
      var specifiers = this.transformList(tree.specifiers);
      return new ExpressionStatement(tree.location, new CommaExpression(tree.location, specifiers.filter(function(specifier) {
        return specifier;
      })));
    },
    transformNameSpaceExport: function(tree) {
      this.addExternalExportBinding(this.curDepIndex_, tree.name.value, null);
      return tree;
    },
    transformForwardDefaultExport: function(tree) {
      this.addExternalExportBinding(this.curDepIndex_, tree.name.value, 'default');
      return tree;
    },
    transformImportSpecifier: function(tree) {
      var localBinding = tree.binding.binding;
      var localBindingToken = localBinding.identifierToken;
      var importName = (tree.name || localBindingToken).value;
      this.addImportBinding(this.curDepIndex_, localBindingToken.value, importName);
      return new VariableDeclaration(tree.location, localBinding, null, null);
    },
    transformModuleSpecifier: function(tree) {
      this.curDepIndex_ = this.getOrCreateDependencyIndex(tree);
      return tree;
    }
  }, {}, $__super);
}(ModuleTransformer);
