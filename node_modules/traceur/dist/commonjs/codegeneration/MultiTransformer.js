"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  MultiTransformer: {
    enumerable: true,
    get: function() {
      return MultiTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ParseTreeValidator = require("../syntax/ParseTreeValidator.js").ParseTreeValidator;
var MultiTransformer = function() {
  function MultiTransformer(reporter, validate) {
    this.reporter_ = reporter;
    this.validate_ = validate;
    this.treeTransformers_ = [];
  }
  return ($__createClass)(MultiTransformer, {
    append: function(treeTransformer) {
      this.treeTransformers_.push(treeTransformer);
    },
    transform: function(tree) {
      var reporter = this.reporter_;
      var validate = this.validate_;
      this.treeTransformers_.every(function(transformTree) {
        tree = transformTree(tree);
        if (reporter.hadError())
          return false;
        if (validate)
          ParseTreeValidator.validate(tree);
        return true;
      });
      return tree;
    }
  }, {});
}();
