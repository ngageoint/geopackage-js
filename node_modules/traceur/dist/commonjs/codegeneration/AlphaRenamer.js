"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AlphaRenamer: {
    enumerable: true,
    get: function() {
      return AlphaRenamer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var ScopeTransformer = require("./ScopeTransformer.js").ScopeTransformer;
var $__5 = require("../syntax/trees/ParseTrees.js"),
    FunctionDeclaration = $__5.FunctionDeclaration,
    FunctionExpression = $__5.FunctionExpression;
var THIS = require("../syntax/PredefinedName.js").THIS;
var createIdentifierExpression = require("./ParseTreeFactory.js").createIdentifierExpression;
var AlphaRenamer = function($__super) {
  function AlphaRenamer(varName, newName) {
    $__superConstructor(AlphaRenamer).call(this, varName);
    this.newName_ = newName;
  }
  return ($__createClass)(AlphaRenamer, {
    transformIdentifierExpression: function(tree) {
      if (this.varName_ === tree.identifierToken.value) {
        return createIdentifierExpression(this.newName_);
      } else {
        return tree;
      }
    },
    transformThisExpression: function(tree) {
      if (this.varName_ !== THIS)
        return tree;
      return createIdentifierExpression(this.newName_);
    },
    transformFunctionDeclaration: function(tree) {
      if (this.varName_ === tree.name) {
        tree = new FunctionDeclaration(tree.location, this.newName_, tree.functionKind, tree.parameterList, tree.typeAnnotation, tree.annotations, tree.body);
      }
      return $__superGet(this, AlphaRenamer.prototype, "transformFunctionDeclaration").call(this, tree);
    },
    transformFunctionExpression: function(tree) {
      if (this.varName_ === tree.name) {
        tree = new FunctionExpression(tree.location, this.newName_, tree.functionKind, tree.parameterList, tree.typeAnnotation, tree.annotations, tree.body);
      }
      return $__superGet(this, AlphaRenamer.prototype, "transformFunctionExpression").call(this, tree);
    }
  }, {rename: function(tree, varName, newName) {
      return new AlphaRenamer(varName, newName).transformAny(tree);
    }}, $__super);
}(ScopeTransformer);
