"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  NodeTraceurLoader: {
    enumerable: true,
    get: function() {
      return NodeTraceurLoader;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var TraceurLoader = require("./TraceurLoader.js").TraceurLoader;
var NodeLoaderCompiler = require("../node/NodeLoaderCompiler.js").NodeLoaderCompiler;
var NodeTraceurLoader = function($__super) {
  function NodeTraceurLoader() {
    var path = require('path');
    var fileloader = require('../node/nodeLoader.js');
    var url = (path.resolve('./') + '/').replace(/\\/g, '/');
    $__superConstructor(NodeTraceurLoader).call(this, fileloader, url, new NodeLoaderCompiler());
    this.traceurMap_ = null;
  }
  return ($__createClass)(NodeTraceurLoader, {getSourceMap: function(filename) {
      var map = $__superGet(this, NodeTraceurLoader.prototype, "getSourceMap").call(this, filename);
      if (!map && filename.replace(/\\/g, '/').endsWith('/bin/traceur.js')) {
        if (!this.traceurMap_) {
          var fs = require('fs');
          this.traceurMap_ = fs.readFileSync(filename + '.map', 'utf8');
        }
        map = this.traceurMap_;
      }
      return map;
    }}, {}, $__super);
}(TraceurLoader);
