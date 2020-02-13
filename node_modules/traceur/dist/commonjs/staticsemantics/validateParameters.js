"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return $__default;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var ParseTreeVisitor = require("../syntax/ParseTreeVisitor.js").ParseTreeVisitor;
var StringSet = require("../util/StringSet.js").StringSet;
var isStrictKeyword = require("../syntax/Keywords.js").isStrictKeyword;
var ParameterValidationVisitor = function($__super) {
  function ParameterValidationVisitor(isStrict, reporter) {
    $__superConstructor(ParameterValidationVisitor).call(this);
    this.reporter_ = reporter;
    this.names_ = new StringSet();
    this.errors_ = [];
    this.reportStrictKeywords_ = isStrict;
    this.reportDuplicates_ = isStrict;
  }
  return ($__createClass)(ParameterValidationVisitor, {
    visitBindingIdentifier: function(tree) {
      var name = tree.identifierToken.toString();
      if (this.reportStrictKeywords_ && (isStrictKeyword(name) || name === 'eval' || name === 'arguments')) {
        this.reporter_.reportError(tree.location, (name + " is a reserved identifier"));
      }
      if (this.names_.has(name)) {
        this.maybeReportDuplicateError_(name, tree.location);
      }
      this.names_.add(name);
    },
    visitBindingElement: function(tree) {
      if (tree.initializer !== null) {
        this.reportEarlierErrors_();
      }
      this.visitAny(tree.binding);
    },
    visitRestParameter: function(tree) {
      this.reportEarlierErrors_();
      this.visitAny(tree.identifier);
    },
    visitFormalParameter: function(tree) {
      this.visitAny(tree.parameter);
    },
    visitArrayPattern: function(tree) {
      this.reportEarlierErrors_();
      $__superGet(this, ParameterValidationVisitor.prototype, "visitArrayPattern").call(this, tree);
    },
    visitObjectPattern: function(tree) {
      this.reportEarlierErrors_();
      $__superGet(this, ParameterValidationVisitor.prototype, "visitObjectPattern").call(this, tree);
    },
    reportDuplicateError_: function(name, location) {
      this.reporter_.reportError(location, ("Duplicate parameter name " + name));
    },
    maybeReportDuplicateError_: function(name, location) {
      if (this.reportDuplicates_) {
        this.reportDuplicateError_(name, location);
      } else {
        this.errors_.push(name, location);
      }
    },
    reportEarlierErrors_: function() {
      if (!this.reportDuplicates_) {
        this.reportDuplicates_ = true;
        for (var i = 0; i < this.errors_.length; i += 2) {
          var name = this.errors_[i];
          var location = this.errors_[i + 1];
          this.reportDuplicateError_(name, location);
        }
      }
    }
  }, {}, $__super);
}(ParseTreeVisitor);
var $__default = function(tree, isStrict, reporter) {
  new ParameterValidationVisitor(isStrict, reporter).visitAny(tree);
};
