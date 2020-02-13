"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  InlineModuleTransformer: {
    enumerable: true,
    get: function() {
      return InlineModuleTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var VAR = require("../syntax/TokenType.js").VAR;
var ModuleTransformer = require("./ModuleTransformer.js").ModuleTransformer;
var $__5 = require("./ParseTreeFactory.js"),
    createBindingIdentifier = $__5.createBindingIdentifier,
    createEmptyStatement = $__5.createEmptyStatement,
    createFunctionBody = $__5.createFunctionBody,
    createImmediatelyInvokedFunctionExpression = $__5.createImmediatelyInvokedFunctionExpression,
    createVariableStatement = $__5.createVariableStatement;
var anonInlineModules = 0;
var InlineModuleTransformer = function($__super) {
  function InlineModuleTransformer() {
    $__superConstructor(InlineModuleTransformer).apply(this, arguments);
  }
  return ($__createClass)(InlineModuleTransformer, {
    wrapModule: function(statements) {
      var seed = this.moduleName || 'anon_' + ++anonInlineModules;
      var idName = this.getTempVarNameForModuleName(seed);
      var body = createFunctionBody(statements);
      var moduleExpression = createImmediatelyInvokedFunctionExpression(body);
      return [createVariableStatement(VAR, idName, moduleExpression)];
    },
    transformNamedExport: function(tree) {
      return createEmptyStatement();
    },
    transformModuleSpecifier: function(tree) {
      return createBindingIdentifier(this.getTempVarNameForModuleSpecifier(tree));
    }
  }, {}, $__super);
}(ModuleTransformer);
