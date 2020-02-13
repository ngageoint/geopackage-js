"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  buildExportList: {
    enumerable: true,
    get: function() {
      return buildExportList;
    }
  }
});
var ExportVisitor = require("./ExportVisitor.js").ExportVisitor;
var ValidationVisitor = require("./ValidationVisitor.js").ValidationVisitor;
function buildExportList(deps, loader, reporter) {
  function doVisit(ctor) {
    for (var i = 0; i < deps.length; i++) {
      var visitor = new ctor(reporter, loader, deps[i]);
      visitor.visitAny(deps[i].tree);
    }
  }
  function reverseVisit(ctor) {
    for (var i = deps.length - 1; i >= 0; i--) {
      var visitor = new ctor(reporter, loader, deps[i]);
      visitor.visitAny(deps[i].tree);
    }
  }
  reverseVisit(ExportVisitor);
  doVisit(ValidationVisitor);
}
