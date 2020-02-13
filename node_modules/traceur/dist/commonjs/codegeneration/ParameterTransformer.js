"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ParameterTransformer: {
    enumerable: true,
    get: function() {
      return ParameterTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var FunctionBody = require("../syntax/trees/ParseTrees.js").FunctionBody;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var prependStatements = require("./PrependStatements.js").prependStatements;
var stack = [];
var ParameterTransformer = function($__super) {
  function ParameterTransformer() {
    $__superConstructor(ParameterTransformer).apply(this, arguments);
  }
  return ($__createClass)(ParameterTransformer, {
    transformArrowFunction: function(tree) {
      stack.push([]);
      return $__superGet(this, ParameterTransformer.prototype, "transformArrowFunction").call(this, tree);
    },
    transformFunctionDeclaration: function(tree) {
      stack.push([]);
      return $__superGet(this, ParameterTransformer.prototype, "transformFunctionDeclaration").call(this, tree);
    },
    transformFunctionExpression: function(tree) {
      stack.push([]);
      return $__superGet(this, ParameterTransformer.prototype, "transformFunctionExpression").call(this, tree);
    },
    transformGetAccessor: function(tree) {
      stack.push([]);
      return $__superGet(this, ParameterTransformer.prototype, "transformGetAccessor").call(this, tree);
    },
    transformSetAccessor: function(tree) {
      stack.push([]);
      return $__superGet(this, ParameterTransformer.prototype, "transformSetAccessor").call(this, tree);
    },
    transformMethod: function(tree) {
      stack.push([]);
      return $__superGet(this, ParameterTransformer.prototype, "transformMethod").call(this, tree);
    },
    transformFunctionBody: function(tree) {
      var transformedTree = $__superGet(this, ParameterTransformer.prototype, "transformFunctionBody").call(this, tree);
      var statements = stack.pop();
      if (!statements.length)
        return transformedTree;
      statements = prependStatements.apply((void 0), $__spread([transformedTree.statements], statements));
      return new FunctionBody(transformedTree.location, statements);
    },
    get parameterStatements() {
      return stack[stack.length - 1];
    },
    transformConstructorType: function(tree) {
      return tree;
    },
    transformFunctionType: function(tree) {
      return tree;
    }
  }, {}, $__super);
}(TempVarTransformer);
