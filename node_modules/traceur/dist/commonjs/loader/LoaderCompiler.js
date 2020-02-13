"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  LoaderCompiler: {
    enumerable: true,
    get: function() {
      return LoaderCompiler;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var buildExportList = require("../codegeneration/module/ExportListBuilder.js").buildExportList;
var CollectingErrorReporter = require("../util/CollectingErrorReporter.js").CollectingErrorReporter;
var Compiler = require("../Compiler.js").Compiler;
var ModuleSpecifierVisitor = require("../codegeneration/module/ModuleSpecifierVisitor.js").ModuleSpecifierVisitor;
var ModuleSymbol = require("../codegeneration/module/ModuleSymbol.js").ModuleSymbol;
var Parser = require("../syntax/Parser.js").Parser;
var SourceFile = require("../syntax/SourceFile.js").SourceFile;
var systemjs = require("./system-map.js").systemjs;
var UniqueIdentifierGenerator = require("../codegeneration/UniqueIdentifierGenerator.js").UniqueIdentifierGenerator;
var $__11 = require("../util/url.js"),
    isAbsolute = $__11.isAbsolute,
    resolveUrl = $__11.resolveUrl;
var assert = require("../util/assert.js").assert;
var NOT_STARTED = 0;
var LOADING = 1;
var LOADED = 2;
var PARSED = 3;
var TRANSFORMING = 4;
var TRANSFORMED = 5;
var COMPLETE = 6;
var ERROR = 7;
var identifierGenerator = new UniqueIdentifierGenerator();
var anonymousSourcesSeen = 0;
var LoaderCompiler = function() {
  function LoaderCompiler() {}
  return ($__createClass)(LoaderCompiler, {
    getModuleSpecifiers: function(codeUnit) {
      this.parse(codeUnit);
      var moduleSpecifierVisitor = new ModuleSpecifierVisitor(codeUnit.metadata.traceurOptions);
      moduleSpecifierVisitor.visit(codeUnit.metadata.tree);
      return moduleSpecifierVisitor.moduleSpecifiers;
    },
    parse: function(codeUnit) {
      assert(!codeUnit.metadata.tree);
      var metadata = codeUnit.metadata;
      var options = metadata.traceurOptions;
      if (codeUnit.type === 'script')
        options.script = true;
      metadata.compiler = new Compiler(options);
      var sourceName = codeUnit.metadata.sourceName = codeUnit.address || codeUnit.normalizedName || '(unnamed)#' + String(++anonymousSourcesSeen);
      metadata.tree = metadata.compiler.parse(codeUnit.source, sourceName);
    },
    transform: function(codeUnit) {
      var metadata = codeUnit.metadata;
      metadata.transformedTree = metadata.compiler.transform(metadata.tree, codeUnit.normalizedName, metadata);
    },
    write: function(codeUnit) {
      var metadata = codeUnit.metadata;
      var outputName = metadata.outputName || metadata.sourceName || '<loaderOutput>';
      var sourceRoot = metadata.sourceRoot;
      var sourceURL = metadata.sourceName || codeUnit.normalizedName || codeUnit.address;
      metadata.transcoded = metadata.compiler.write(metadata.transformedTree, outputName, undefined, sourceURL);
    },
    evaluateCodeUnit: function(codeUnit) {
      var result = ('global', eval)(codeUnit.metadata.transcoded);
      codeUnit.metadata.transformedTree = null;
      return result;
    },
    analyzeDependencies: function(dependencies, loader) {
      var deps = [];
      for (var i = 0; i < dependencies.length; i++) {
        var codeUnit = dependencies[i];
        assert(codeUnit.state >= PARSED);
        if (codeUnit.state == PARSED) {
          var symbol = codeUnit.metadata.moduleSymbol = new ModuleSymbol(codeUnit.metadata.tree, codeUnit.normalizedName);
          deps.push(symbol);
        }
      }
      this.checkForErrors(function(reporter) {
        return buildExportList(deps, loader, reporter);
      });
    },
    checkForErrors: function(fncOfReporter) {
      var reporter = new CollectingErrorReporter();
      var result = fncOfReporter(reporter);
      if (reporter.hadError())
        throw reporter.toError();
      return result;
    }
  }, {});
}();
