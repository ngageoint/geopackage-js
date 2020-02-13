"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  HTMLImportTranscoder: {
    enumerable: true,
    get: function() {
      return HTMLImportTranscoder;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var StringMap = require("./util/StringMap.js").StringMap;
var $__5 = require("./WebPageTranscoder.js"),
    WebPageTranscoder = $__5.WebPageTranscoder,
    scriptSelector = $__5.scriptSelector;
var importSelector = 'link[rel=import][href]';
var HTMLImportTranscoder = function() {
  function HTMLImportTranscoder() {
    this.importsToProcess_ = [];
  }
  return ($__createClass)(HTMLImportTranscoder, {
    findAllChildrenHTMLImports_: function(parentImportNodes) {
      var foundImportNodes = [];
      for (var parentIndex = 0; parentIndex < parentImportNodes.length; parentIndex++) {
        var parentLink = parentImportNodes[parentIndex];
        var childImportNodes = parentLink.import.querySelectorAll(importSelector);
        if (childImportNodes.length > 0)
          this.findAllChildrenHTMLImports_(childImportNodes);
        this.importsToProcess_.push(parentLink);
      }
    },
    filterHTMLImports_: function(importNodes) {
      this.findAllChildrenHTMLImports_(importNodes);
      var importsToParse = [];
      var dupFilterMap = new StringMap();
      for (var index = 0; index < this.importsToProcess_.length; index++) {
        var processLink = this.importsToProcess_[index];
        if (!dupFilterMap.has(processLink.href)) {
          dupFilterMap.set(processLink.href, 0);
          var scripts = processLink.import.querySelectorAll(scriptSelector);
          if (scripts.length > 0)
            importsToParse.push({
              href: processLink.href,
              scripts: scripts
            });
        }
      }
      this.importsToProcess_ = [];
      return importsToParse;
    },
    selectAndProcessHTMLImports: function(importNodes, done) {
      var importInfoList = this.filterHTMLImports_(importNodes);
      if (importInfoList.length === 0)
        done();
      var processCount = importInfoList.length;
      importInfoList.forEach(function(importInfo) {
        var transcoder = new WebPageTranscoder(importInfo.href);
        transcoder.addFilesFromScriptElements(importInfo.scripts, function() {
          processCount--;
          if (processCount === 0 && done)
            done();
        });
      });
    },
    run: function() {
      var done = arguments[0] !== (void 0) ? arguments[0] : function() {};
      var $__2 = this;
      var ready = document.readyState;
      if (ready === 'complete' || ready === 'loaded') {
        var importNodes = document.querySelectorAll(importSelector);
        if (importNodes.length > 0)
          this.selectAndProcessHTMLImports(importNodes, done);
      } else {
        document.addEventListener('HTMLImportsLoaded', function(event) {
          var importNodes = event.detail && event.detail.allImports ? event.detail.allImports : document.querySelectorAll(importSelector);
          if (importNodes.length > 0)
            $__2.selectAndProcessHTMLImports(importNodes, done);
        });
      }
    }
  }, {});
}();
