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
      return SkipFunctionsTransformerTrait;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__3 = require("../syntax/trees/ParseTrees.js"),
    ArrowFunction = $__3.ArrowFunction,
    FunctionDeclaration = $__3.FunctionDeclaration,
    FunctionExpression = $__3.FunctionExpression,
    GetAccessor = $__3.GetAccessor,
    Method = $__3.Method,
    SetAccessor = $__3.SetAccessor;
function SkipFunctionsTransformerTrait(ParseTreeTransformer) {
  return function($__super) {
    function SkipFunctionsTransformer() {
      $__superConstructor(SkipFunctionsTransformer).apply(this, arguments);
    }
    return ($__createClass)(SkipFunctionsTransformer, {
      transformFunctionDeclaration: function(tree) {
        var annotations = this.transformList(tree.annotations);
        if (annotations === tree.annotations) {
          return tree;
        }
        return new FunctionDeclaration(tree.location, tree.name, tree.functionKind, tree.parameterList, tree.typeAnnotation, annotations, tree.body);
      },
      transformFunctionExpression: function(tree) {
        var annotations = this.transformList(tree.annotations);
        if (annotations === tree.annotations) {
          return tree;
        }
        return new FunctionDeclaration(tree.location, tree.name, tree.functionKind, tree.parameterList, tree.typeAnnotation, annotations, tree.body);
      },
      transformSetAccessor: function(tree) {
        var name = this.transformAny(tree.name);
        var annotations = this.transformList(tree.annotations);
        if (name === tree.name && annotations === tree.annotations) {
          return tree;
        }
        return new SetAccessor(tree.location, tree.isStatic, name, tree.parameterList, annotations, tree.body);
      },
      transformGetAccessor: function(tree) {
        var name = this.transformAny(tree.name);
        var annotations = this.transformList(tree.annotations);
        if (name === tree.name && annotations === tree.annotations) {
          return tree;
        }
        return new GetAccessor(tree.location, tree.isStatic, name, annotations, tree.body);
      },
      transformMethod: function(tree) {
        var name = this.transformAny(tree.name);
        var annotations = this.transformList(tree.annotations);
        if (name === tree.name && annotations === tree.annotations) {
          return tree;
        }
        return new Method(tree.location, tree.isStatic, tree.functionKind, name, tree.parameterList, tree.typeAnnotation, annotations, tree.body, tree.debugName);
      },
      transformArrowFunction: function(tree) {
        return tree;
      }
    }, {}, $__super);
  }(ParseTreeTransformer);
}
