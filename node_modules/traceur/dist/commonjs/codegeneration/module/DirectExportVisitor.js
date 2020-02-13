"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  DirectExportVisitor: {
    enumerable: true,
    get: function() {
      return DirectExportVisitor;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ExportVisitor = require("./ExportVisitor.js").ExportVisitor;
var TYPE_ALIAS_DECLARATION = require("../../syntax/trees/ParseTreeType.js").TYPE_ALIAS_DECLARATION;
var DirectExportVisitor = function($__super) {
  function DirectExportVisitor() {
    $__superConstructor(DirectExportVisitor).call(this, null, null, null);
    this.namedExports = [];
    this.starExports = [];
  }
  return ($__createClass)(DirectExportVisitor, {
    addExport: function(name, tree) {
      this.namedExports.push({
        name: name,
        tree: tree,
        moduleSpecifier: this.moduleSpecifier
      });
    },
    visitExportStar: function(tree) {
      this.starExports.push(this.moduleSpecifier);
    },
    hasExports: function() {
      return this.namedExports.length !== 0 || this.starExports.length !== 0;
    },
    getNonTypeNamedExports: function() {
      return this.namedExports.filter(function(exp) {
        return exp.tree.type !== TYPE_ALIAS_DECLARATION;
      });
    }
  }, {}, $__super);
}(ExportVisitor);
