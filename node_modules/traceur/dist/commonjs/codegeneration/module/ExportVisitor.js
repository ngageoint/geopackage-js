"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ExportVisitor: {
    enumerable: true,
    get: function() {
      return ExportVisitor;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ModuleVisitor = require("./ModuleVisitor.js").ModuleVisitor;
var assert = require("../../util/assert.js").assert;
var ExportVisitor = function($__super) {
  function ExportVisitor(reporter, loader, moduleSymbol) {
    $__superConstructor(ExportVisitor).call(this, reporter, loader, moduleSymbol);
    this.inExport_ = false;
    this.moduleSpecifier = null;
  }
  return ($__createClass)(ExportVisitor, {
    addExport_: function(name, tree) {
      assert(typeof name === 'string');
      if (this.inExport_)
        this.addExport(name, tree);
    },
    addExport: function(name, tree) {
      var moduleSymbol = this.moduleSymbol;
      var existingExport = moduleSymbol.getExport(name);
      if (existingExport) {
        this.reportError(tree, ("Duplicate export. '" + name + "' was previously ") + ("exported at " + existingExport.location.start));
      } else {
        moduleSymbol.addExport(name, tree);
      }
    },
    visitClassDeclaration: function(tree) {
      this.addExport_(tree.name.identifierToken.value, tree);
    },
    visitExportDeclaration: function(tree) {
      this.inExport_ = true;
      this.visitAny(tree.declaration);
      this.inExport_ = false;
    },
    visitNamedExport: function(tree) {
      this.moduleSpecifier = tree.moduleSpecifier;
      this.visitAny(tree.exportClause);
      this.moduleSpecifier = null;
    },
    visitExportDefault: function(tree) {
      this.addExport_('default', tree);
    },
    visitExportSpecifier: function(tree) {
      this.addExport_((tree.rhs || tree.lhs).value, tree);
    },
    visitExportStar: function(tree) {
      var $__1 = this;
      var name = this.moduleSpecifier.token.processedValue;
      var exportList = this.getExportsListForModuleSpecifier(name);
      if (exportList) {
        exportList.getExports().forEach(function(name) {
          return $__1.addExport(name, tree);
        });
      }
    },
    visitNameSpaceExport: function(tree) {
      this.addExport_(tree.name.value, tree);
    },
    visitForwardDefaultExport: function(tree) {
      this.addExport_(tree.name.value, tree);
    },
    visitFunctionDeclaration: function(tree) {
      this.addExport_(tree.name.getStringValue(), tree);
    },
    visitVariableDeclaration: function(tree) {
      this.visitAny(tree.lvalue);
    },
    visitBindingIdentifier: function(tree) {
      this.addExport_(tree.getStringValue(), tree);
    },
    visitBindingElement: function(tree) {
      this.visitAny(tree.binding);
    },
    visitTypeAliasDeclaration: function(tree) {
      this.addExport(tree.name.value, tree);
    }
  }, {}, $__super);
}(ModuleVisitor);
