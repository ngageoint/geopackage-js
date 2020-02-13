"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  CommonJsModuleTransformer: {
    enumerable: true,
    get: function() {
      return CommonJsModuleTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ModuleTransformer = require("./ModuleTransformer.js").ModuleTransformer;
var NAMED_EXPORT = require("../syntax/trees/ParseTreeType.js").NAMED_EXPORT;
var AnonBlock = require("../syntax/trees/ParseTrees.js").AnonBlock;
var $__11 = require("./PlaceholderParser.js"),
    parseExpression = $__11.parseExpression,
    parsePropertyDefinition = $__11.parsePropertyDefinition,
    parseStatement = $__11.parseStatement;
var $__12 = require("./ParseTreeFactory.js"),
    createExpressionStatement = $__12.createExpressionStatement,
    createObjectLiteral = $__12.createObjectLiteral,
    createObjectLiteralForDescriptor = $__12.createObjectLiteralForDescriptor,
    createPropertyNameAssignment = $__12.createPropertyNameAssignment;
var prependStatements = require("./PrependStatements.js").prependStatements;
var FindVisitor = require("./FindVisitor.js").FindVisitor;
var CommonJsModuleTransformer = function($__super) {
  function CommonJsModuleTransformer(identifierGenerator, reporter) {
    var options = arguments[2];
    $__superConstructor(CommonJsModuleTransformer).call(this, identifierGenerator, reporter, options);
    this.anonymousModule = options && !options.bundle && options.moduleName !== true;
    this.namedExportsWithModuleSpecifiers_ = [];
    this.isImportingDefault_ = false;
    this.needsInteropRequire_ = false;
  }
  return ($__createClass)(CommonJsModuleTransformer, {
    getModuleName: function(tree) {
      if (this.anonymousModule)
        return null;
      return tree.moduleName;
    },
    wrapModule: function(statements) {
      if (this.needsInteropRequire_) {
        var req = parseStatement($__getTemplateObject(["function $__interopRequire(id) {\n        id = require(id);\n        return id && id.__esModule && id || {default: id};\n      }"]));
        return prependStatements(statements, req);
      }
      return statements;
    },
    addExportStatement: function(statements) {
      if (!this.hasExports()) {
        return statements;
      }
      var descr = this.getExportDescriptors();
      var exportObject = parseExpression($__getTemplateObject(["Object.defineProperties(module.exports, ", ")"]), descr);
      if (this.hasStarExports()) {
        exportObject = this.getExportStar(exportObject);
      }
      return prependStatements.apply((void 0), $__spread([statements], this.namedExportsWithModuleSpecifiers_, [createExpressionStatement(exportObject)]));
    },
    getExportDescriptors: function() {
      var $__2 = this;
      var properties = this.exportVisitor.getNonTypeNamedExports().map(function(exp) {
        var f = parseExpression($__getTemplateObject(["function() { return ", "; }"]), $__2.getGetterExportReturnExpression(exp));
        return createPropertyNameAssignment(exp.name, createObjectLiteralForDescriptor({
          enumerable: true,
          get: f
        }));
      });
      properties.unshift(parsePropertyDefinition($__getTemplateObject(["__esModule: {value: true}"])));
      return createObjectLiteral(properties);
    },
    transformExportDeclaration: function(tree) {
      this.checkForDefaultImport_(tree);
      this.exportVisitor.visitAny(tree);
      var transformed = this.transformAny(tree.declaration);
      if (tree.declaration.type == NAMED_EXPORT && tree.declaration.moduleSpecifier !== null) {
        this.namedExportsWithModuleSpecifiers_.push(transformed);
        return new AnonBlock(null, []);
      }
      return transformed;
    },
    transformImportDeclaration: function(tree) {
      this.checkForDefaultImport_(tree);
      return $__superGet(this, CommonJsModuleTransformer.prototype, "transformImportDeclaration").call(this, tree);
    },
    checkForDefaultImport_: function(tree) {
      var finder = new FindDefault();
      finder.visitAny(tree);
      this.isImportingDefault_ = finder.found;
    },
    transformModuleSpecifier: function(tree) {
      var moduleName = tree.token.processedValue;
      if (this.isImportingDefault_) {
        this.needsInteropRequire_ = true;
        return parseExpression($__getTemplateObject(["$__interopRequire(", ")"]), moduleName);
      }
      return parseExpression($__getTemplateObject(["require(", ")"]), moduleName);
    }
  }, {}, $__super);
}(ModuleTransformer);
var FindDefault = function($__super) {
  function FindDefault() {
    $__superConstructor(FindDefault).apply(this, arguments);
  }
  return ($__createClass)(FindDefault, {
    visitImportSpecifier: function(tree) {
      this.found = tree.name !== null && tree.name.value === 'default';
    },
    visitNameSpaceImport: function(tree) {
      this.found = true;
    },
    visitNameSpaceExport: function(tree) {
      this.found = true;
    },
    visitExportSpecifier: function(tree) {
      this.found = tree.lhs !== null && tree.lhs.value === 'default';
    }
  }, {}, $__super);
}(FindVisitor);
