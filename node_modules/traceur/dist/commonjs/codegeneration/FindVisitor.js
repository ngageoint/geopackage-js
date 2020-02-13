"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  FindVisitor: {
    enumerable: true,
    get: function() {
      return FindVisitor;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTreeVisitor = require("../syntax/ParseTreeVisitor.js").ParseTreeVisitor;
var FindVisitor = function($__super) {
  function FindVisitor() {
    var keepOnGoing = arguments[0];
    $__superConstructor(FindVisitor).call(this);
    this.found_ = false;
    this.shouldContinue_ = true;
    this.keepOnGoing_ = keepOnGoing;
  }
  return ($__createClass)(FindVisitor, {
    get found() {
      return this.found_;
    },
    set found(v) {
      if (v) {
        this.found_ = true;
        if (!this.keepOnGoing_)
          this.shouldContinue_ = false;
      }
    },
    visitAny: function(tree) {
      this.shouldContinue_ && tree && tree.visit(this);
    },
    visitList: function(list) {
      if (list) {
        for (var i = 0; this.shouldContinue_ && i < list.length; i++) {
          this.visitAny(list[i]);
        }
      }
    }
  }, {}, $__super);
}(ParseTreeVisitor);
