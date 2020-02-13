"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AmdTransformer: {
    enumerable: true,
    get: function() {
      return AmdTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ModuleTransformer = require("./ModuleTransformer.js").ModuleTransformer;
var $__7 = require("./ParseTreeFactory.js"),
    createIdentifierExpression = $__7.createIdentifierExpression,
    createFormalParameter = $__7.createFormalParameter,
    createStringLiteralToken = $__7.createStringLiteralToken;
var globalThis = $__interopRequire("./globalThis.js").default;
var $__9 = require("./PlaceholderParser.js"),
    parseExpression = $__9.parseExpression,
    parseStatement = $__9.parseStatement,
    parseStatements = $__9.parseStatements,
    parsePropertyDefinition = $__9.parsePropertyDefinition;
var $__10 = require("../syntax/trees/ParseTrees.js"),
    FormalParameterList = $__10.FormalParameterList,
    FunctionBody = $__10.FunctionBody,
    FunctionExpression = $__10.FunctionExpression;
var AmdTransformer = function($__super) {
  function AmdTransformer(identifierGenerator, reporter) {
    var options = arguments[2];
    $__superConstructor(AmdTransformer).call(this, identifierGenerator, reporter, options);
    this.dependencies = [];
    this.anonymousModule = options && !options.bundle && options.moduleName !== true;
  }
  return ($__createClass)(AmdTransformer, {
    getModuleName: function(tree) {
      if (this.anonymousModule)
        return null;
      return tree.moduleName;
    },
    getExportProperties: function() {
      var properties = $__superGet(this, AmdTransformer.prototype, "getExportProperties").call(this);
      if (this.exportVisitor.hasExports())
        properties.push(parsePropertyDefinition($__getTemplateObject(["__esModule: true"])));
      return properties;
    },
    moduleProlog: function() {
      var locals = this.dependencies.map(function(dep) {
        var local = createIdentifierExpression(dep.local);
        return parseStatement($__getTemplateObject(["if (!", " || !", ".__esModule)\n            ", " = {default: ", "}"]), local, local, local, local);
      });
      return $__superGet(this, AmdTransformer.prototype, "moduleProlog").call(this).concat(locals);
    },
    wrapModule: function(statements) {
      var depPaths = this.dependencies.map(function(dep) {
        return dep.path;
      });
      var formals = this.dependencies.map(function(dep) {
        return createFormalParameter(dep.local);
      });
      var parameterList = new FormalParameterList(null, formals);
      var body = new FunctionBody(null, statements);
      var func = new FunctionExpression(null, null, null, parameterList, null, [], body);
      if (this.moduleName) {
        return parseStatements($__getTemplateObject(["define(", ", ", ", ", ");"]), this.moduleName, depPaths, func);
      } else {
        return parseStatements($__getTemplateObject(["define(", ", ", ");"]), depPaths, func);
      }
    },
    transformModuleSpecifier: function(tree) {
      var localName = this.getTempIdentifier();
      var value = tree.token.processedValue;
      var stringLiteral = createStringLiteralToken(value.replace(/\.js$/, ''));
      this.dependencies.push({
        path: stringLiteral,
        local: localName
      });
      return createIdentifierExpression(localName);
    }
  }, {}, $__super);
}(ModuleTransformer);
