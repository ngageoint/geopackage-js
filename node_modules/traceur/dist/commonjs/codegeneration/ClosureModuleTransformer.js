"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ClosureModuleTransformer: {
    enumerable: true,
    get: function() {
      return ClosureModuleTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ModuleTransformer = require("./ModuleTransformer.js").ModuleTransformer;
var $__7 = require("./ParseTreeFactory.js"),
    createIdentifierExpression = $__7.createIdentifierExpression,
    createMemberExpression = $__7.createMemberExpression,
    createPropertyNameAssignment = $__7.createPropertyNameAssignment;
var $__8 = require("../syntax/trees/ParseTreeType.js"),
    EXPORT_DEFAULT = $__8.EXPORT_DEFAULT,
    EXPORT_SPECIFIER = $__8.EXPORT_SPECIFIER;
var $__9 = require("./PlaceholderParser.js"),
    parseExpression = $__9.parseExpression,
    parseStatement = $__9.parseStatement,
    parseStatements = $__9.parseStatements;
var prependStatements = require("./PrependStatements.js").prependStatements;
var ClosureModuleTransformer = function($__super) {
  function ClosureModuleTransformer() {
    $__superConstructor(ClosureModuleTransformer).apply(this, arguments);
  }
  return ($__createClass)(ClosureModuleTransformer, {
    moduleProlog: function() {
      if (!this.moduleName) {
        throw new Error('Closure modules (goog.module) require a moduleName');
      }
      return parseStatements($__getTemplateObject(["goog.module(", ");"]), this.moduleName);
    },
    wrapModule: function(statements) {
      if (this.hasStarExports()) {
        throw new Error('Closure modules (goog.module) do not support "export *"');
      }
      return statements;
    },
    addExportStatement: function(statements) {
      if (!this.hasExports())
        return statements;
      var exportObject = this.getExportObject();
      statements.push(parseStatement($__getTemplateObject(["exports = ", ""]), exportObject));
      return statements;
    },
    getGetterExport: function($__1) {
      var $__2 = $__1,
          name = $__2.name,
          tree = $__2.tree,
          moduleSpecifier = $__2.moduleSpecifier;
      var expression;
      switch (tree.type) {
        case EXPORT_DEFAULT:
          expression = createIdentifierExpression('$__default');
          break;
        case EXPORT_SPECIFIER:
          if (moduleSpecifier) {
            var idName = this.getTempVarNameForModuleSpecifier(moduleSpecifier);
            expression = createMemberExpression(idName, tree.lhs);
          } else {
            expression = createPropertyNameAssignment(name, tree.lhs);
          }
          break;
        default:
          expression = createIdentifierExpression(name);
          break;
      }
      return createPropertyNameAssignment(name, expression);
    },
    transformModuleSpecifier: function(tree) {
      var moduleName = tree.token.processedValue;
      return parseExpression($__getTemplateObject(["goog.require(", ")"]), moduleName);
    }
  }, {}, $__super);
}(ModuleTransformer);
