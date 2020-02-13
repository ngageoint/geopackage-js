"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return ImportRuntimeTrait;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__9 = require("../syntax/TokenType.js"),
    CONST = $__9.CONST,
    VAR = $__9.VAR;
var $__10 = require("../syntax/trees/ParseTrees.js"),
    ImportDeclaration = $__10.ImportDeclaration,
    ImportedBinding = $__10.ImportedBinding,
    ImportSpecifier = $__10.ImportSpecifier,
    ImportSpecifierSet = $__10.ImportSpecifierSet,
    Module = $__10.Module,
    ModuleSpecifier = $__10.ModuleSpecifier,
    Script = $__10.Script;
var StringSet = require("../util/StringSet.js").StringSet;
var $__12 = require("./ParseTreeFactory.js"),
    createBindingIdentifier = $__12.createBindingIdentifier,
    createIdentifierToken = $__12.createIdentifierToken,
    createIdentifierExpression = $__12.createIdentifierExpression,
    createMemberExpression = $__12.createMemberExpression,
    createStringLiteral = $__12.createStringLiteral,
    createStringLiteralToken = $__12.createStringLiteralToken,
    createVariableStatement = $__12.createVariableStatement;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var prependStatements = require("./PrependStatements.js").prependStatements;
function toTempName(name) {
  return ("$__" + name);
}
function getDeclarationType(options) {
  return options.parseOptions.blockBinding && !options.transformOptions.blockBinding ? CONST : VAR;
}
function ImportRuntimeTrait(ParseTreeTransformerClass) {
  return function($__super) {
    function $__0() {
      var $__4;
      for (var args = [],
          $__3 = 0; $__3 < arguments.length; $__3++)
        args[$__3] = arguments[$__3];
      ($__4 = $__superConstructor($__0)).call.apply($__4, $__spread([this], args));
      this.importedNames = new StringSet();
      this._existingImports = new StringSet();
    }
    return ($__createClass)($__0, {
      getRuntimeExpression: function(name) {
        if (this.options.importRuntime) {
          this.addImportedName(name);
          return createIdentifierExpression(toTempName(name));
        }
        return createMemberExpression('$traceurRuntime', name);
      },
      get requiredNames() {
        return this.importedNames;
      },
      addImportedName: function(name) {
        this.importedNames.add(name);
      },
      transformScript: function(tree) {
        var transformed = $__superGet(this, $__0.prototype, "transformScript").call(this, tree);
        if (tree === transformed) {
          return tree;
        }
        if (!this.options.importRuntime) {
          return transformed;
        }
        var scriptItemList = this.addRuntimeImports(transformed.scriptItemList);
        return new Script(tree.location, scriptItemList, tree.moduleName);
      },
      transformModule: function(tree) {
        var transformed = $__superGet(this, $__0.prototype, "transformModule").call(this, tree);
        if (tree === transformed) {
          return tree;
        }
        if (!this.options.importRuntime) {
          return transformed;
        }
        var scriptItemList = this.addRuntimeImports(transformed.scriptItemList);
        return new Module(tree.location, scriptItemList, tree.moduleName);
      },
      transformImportedBinding: function(tree) {
        this._existingImports.add(tree.binding.getStringValue());
        return $__superGet(this, $__0.prototype, "transformImportedBinding").call(this, tree);
      },
      _getModuleSpecifier: function(name) {
        var base = 'traceur/dist/commonjs';
        if (this.options.modules === 'parse') {
          base = 'traceur/src';
        }
        var moduleId = createStringLiteralToken((base + "/runtime/modules/" + name + ".js"));
        return new ModuleSpecifier(null, moduleId);
      },
      getRuntimeImports: function() {
        var $__2 = this;
        return this.importedNames.valuesAsArray().filter(function(name) {
          return !$__2._existingImports.has(toTempName(name));
        }).map(function(name) {
          var def = createIdentifierToken('default');
          var binding = new ImportedBinding(null, createBindingIdentifier(toTempName(name)));
          var specifier = new ImportSpecifier(null, binding, def);
          return new ImportDeclaration(null, new ImportSpecifierSet(null, [specifier]), $__2._getModuleSpecifier(name));
        });
      },
      addRuntimeImports: function(scriptItemList) {
        var runtimeImports = this.getRuntimeImports();
        return prependStatements.apply((void 0), $__spread([scriptItemList], runtimeImports));
      }
    }, {}, $__super);
  }(ParseTreeTransformerClass);
}
