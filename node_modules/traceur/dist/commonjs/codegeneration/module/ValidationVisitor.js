"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ValidationVisitor: {
    enumerable: true,
    get: function() {
      return ValidationVisitor;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ModuleVisitor = require("./ModuleVisitor.js").ModuleVisitor;
var ValidationVisitor = function($__super) {
  function ValidationVisitor() {
    $__superConstructor(ValidationVisitor).apply(this, arguments);
  }
  return ($__createClass)(ValidationVisitor, {
    checkExport_: function(tree, name) {
      var description = this.validatingModuleDescription_;
      if (description && !description.getExport(name)) {
        var moduleName = description.normalizedName;
        this.reportError(tree, ("'" + name + "' is not exported by '" + moduleName + "'"));
      }
    },
    checkImport_: function(tree, name) {
      var existingImport = this.moduleSymbol.getImport(name);
      if (existingImport) {
        this.reportError(tree, ("'" + name + "' was previously imported at " + existingImport.location.start));
      } else {
        this.moduleSymbol.addImport(name, tree);
      }
    },
    visitAndValidate_: function(moduleDescription, tree) {
      var validatingModuleDescription = this.validatingModuleDescription_;
      this.validatingModuleDescription_ = moduleDescription;
      this.visitAny(tree);
      this.validatingModuleDescription_ = validatingModuleDescription;
    },
    visitNamedExport: function(tree) {
      if (tree.moduleSpecifier) {
        var name = tree.moduleSpecifier.token.processedValue;
        var moduleDescription = this.getExportsListForModuleSpecifier(name);
        this.visitAndValidate_(moduleDescription, tree.exportClause);
      }
    },
    visitExportSpecifier: function(tree) {
      this.checkExport_(tree, tree.lhs.value);
    },
    visitForwardDefaultExport: function(tree) {
      this.checkExport_(tree, 'default');
    },
    visitImportDeclaration: function(tree) {
      var name = tree.moduleSpecifier.token.processedValue;
      var moduleDescription = this.getExportsListForModuleSpecifier(name);
      this.visitAndValidate_(moduleDescription, tree.importClause);
    },
    visitImportSpecifier: function(tree) {
      var importName = tree.binding.getStringValue();
      var exportName = tree.name ? tree.name.value : importName;
      this.checkImport_(tree, importName);
      this.checkExport_(tree, exportName);
    },
    visitImportedBinding: function(tree) {
      var importName = tree.binding.getStringValue();
      this.checkImport_(tree, importName);
      this.checkExport_(tree, 'default');
    },
    visitNameSpaceImport: function(tree) {
      var importName = tree.binding.binding.getStringValue();
      this.checkImport_(tree, importName);
    }
  }, {}, $__super);
}(ModuleVisitor);
