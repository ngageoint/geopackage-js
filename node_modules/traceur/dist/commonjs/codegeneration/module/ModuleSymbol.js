"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ExportsList: {
    enumerable: true,
    get: function() {
      return ExportsList;
    }
  },
  ModuleSymbol: {
    enumerable: true,
    get: function() {
      return ModuleSymbol;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var StringMap = require("../../util/StringMap.js").StringMap;
var assert = require("../../util/assert.js").assert;
var ExportsList = function() {
  function ExportsList(normalizedName) {
    this.exports_ = new StringMap();
    if (normalizedName !== null)
      this.normalizedName = normalizedName.replace(/\\/g, '/');
    else
      this.normalizedName = null;
  }
  return ($__createClass)(ExportsList, {
    addExport: function(name, tree) {
      assert(!this.exports_.has(name));
      this.exports_.set(name, tree);
    },
    getExport: function(name) {
      return this.exports_.get(name);
    },
    getExports: function() {
      return this.exports_.keysAsArray();
    },
    addExportsFromModule: function(module) {
      var $__2 = this;
      Object.getOwnPropertyNames(module).forEach(function(name) {
        $__2.addExport(name, true);
      });
    }
  }, {});
}();
var ModuleSymbol = function($__super) {
  function ModuleSymbol(tree, normalizedName) {
    $__superConstructor(ModuleSymbol).call(this, normalizedName);
    this.tree = tree;
    this.imports_ = new StringMap();
  }
  return ($__createClass)(ModuleSymbol, {
    addImport: function(name, tree) {
      assert(!this.imports_.has(name));
      this.imports_.set(name, tree);
    },
    getImport: function(name) {
      return this.imports_.get(name);
    }
  }, {}, $__super);
}(ExportsList);
