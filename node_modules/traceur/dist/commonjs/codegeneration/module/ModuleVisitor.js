"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ModuleVisitor: {
    enumerable: true,
    get: function() {
      return ModuleVisitor;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ExportsList = require("./ModuleSymbol.js").ExportsList;
var ParseTreeVisitor = require("../../syntax/ParseTreeVisitor.js").ParseTreeVisitor;
var $__5 = require("../../syntax/trees/ParseTreeType.js"),
    EXPORT_DECLARATION = $__5.EXPORT_DECLARATION,
    IMPORT_DECLARATION = $__5.IMPORT_DECLARATION;
var ModuleVisitor = function($__super) {
  function ModuleVisitor(reporter, loader, moduleSymbol) {
    $__superConstructor(ModuleVisitor).call(this);
    this.reporter = reporter;
    this.loader_ = loader;
    this.moduleSymbol = moduleSymbol;
  }
  return ($__createClass)(ModuleVisitor, {
    getExportsListForModuleSpecifier: function(name) {
      var referrer = this.moduleSymbol.normalizedName;
      return this.loader_.getExportsListForModuleSpecifier(name, referrer);
    },
    visitFunctionDeclaration: function(tree) {},
    visitFunctionExpression: function(tree) {},
    visitFunctionBody: function(tree) {},
    visitBlock: function(tree) {},
    visitClassDeclaration: function(tree) {},
    visitClassExpression: function(tree) {},
    visitModuleElement_: function(element) {
      switch (element.type) {
        case EXPORT_DECLARATION:
        case IMPORT_DECLARATION:
          this.visitAny(element);
      }
    },
    visitScript: function(tree) {
      tree.scriptItemList.forEach(this.visitModuleElement_, this);
    },
    visitModule: function(tree) {
      tree.scriptItemList.forEach(this.visitModuleElement_, this);
    },
    reportError: function(tree, message) {
      this.reporter.reportError(tree.location, message);
    }
  }, {}, $__super);
}(ParseTreeVisitor);
