"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ModuleSpecifierVisitor: {
    enumerable: true,
    get: function() {
      return ModuleSpecifierVisitor;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTreeVisitor = require("../../syntax/ParseTreeVisitor.js").ParseTreeVisitor;
var StringSet = require("../../util/StringSet.js").StringSet;
var ModuleSpecifierVisitor = function($__super) {
  function ModuleSpecifierVisitor(options) {
    $__superConstructor(ModuleSpecifierVisitor).call(this);
    this.options_ = options;
    this.moduleSpecifiers_ = new StringSet();
  }
  return ($__createClass)(ModuleSpecifierVisitor, {
    get moduleSpecifiers() {
      return this.moduleSpecifiers_.valuesAsArray();
    },
    visitModuleSpecifier: function(tree) {
      this.moduleSpecifiers_.add(tree.token.processedValue);
    }
  }, {}, $__super);
}(ParseTreeVisitor);
