"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  NodeLoaderCompiler: {
    enumerable: true,
    get: function() {
      return NodeLoaderCompiler;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var LoaderCompiler = require("../loader/LoaderCompiler.js").LoaderCompiler;
var NodeLoaderCompiler = function($__super) {
  function NodeLoaderCompiler() {
    $__superConstructor(NodeLoaderCompiler).call(this);
    this.sourceMapsInMemory_ = false;
  }
  return ($__createClass)(NodeLoaderCompiler, {
    evaluateCodeUnit: function(codeUnit) {
      var runInThisContext = require('vm').runInThisContext;
      var semver = require('semver');
      var content = codeUnit.metadata.transcoded;
      var filename = codeUnit.address || codeUnit.normalizedName;
      if (codeUnit.metadata.traceurOptions.sourceMaps === 'memory') {
        this.enableMemorySourceMaps_();
      }
      var options;
      if (semver.gte(process.version, '0.12.0')) {
        options = {filename: filename};
      } else {
        options = filename;
      }
      var result = runInThisContext(content, options);
      codeUnit.metadata.transformedTree = null;
      return result;
    },
    enableMemorySourceMaps_: function() {
      if (this.sourceMapsInMemory_) {
        return;
      }
      require('source-map-support').install({retrieveSourceMap: function(url) {
          try {
            var map = System.getSourceMap(url);
            if (map) {
              return {
                url: url,
                map: map
              };
            }
          } catch (ex) {
            console.error('retrieveSourceMap FAILED ', ex);
          }
        }});
      this.sourceMapsInMemory_ = true;
    }
  }, {}, $__super);
}(LoaderCompiler);
