"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  TypeTransformer: {
    enumerable: true,
    get: function() {
      return TypeTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__4 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__4.AnonBlock,
    FormalParameter = $__4.FormalParameter,
    FunctionDeclaration = $__4.FunctionDeclaration,
    FunctionExpression = $__4.FunctionExpression,
    GetAccessor = $__4.GetAccessor,
    Method = $__4.Method,
    VariableDeclaration = $__4.VariableDeclaration;
var $__5 = require("../syntax/trees/ParseTreeType.js"),
    IMPORT_TYPE_CLAUSE = $__5.IMPORT_TYPE_CLAUSE,
    TYPE_ALIAS_DECLARATION = $__5.TYPE_ALIAS_DECLARATION;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var TypeTransformer = function($__super) {
  function TypeTransformer() {
    $__superConstructor(TypeTransformer).apply(this, arguments);
  }
  return ($__createClass)(TypeTransformer, {
    transformVariableDeclaration: function(tree) {
      if (tree.typeAnnotation) {
        tree = new VariableDeclaration(tree.location, tree.lvalue, null, tree.initializer);
      }
      return $__superGet(this, TypeTransformer.prototype, "transformVariableDeclaration").call(this, tree);
    },
    transformFormalParameter: function(tree) {
      if (tree.typeAnnotation !== null)
        return new FormalParameter(tree.location, tree.parameter, null, []);
      return tree;
    },
    transformFunctionDeclaration: function(tree) {
      if (tree.typeAnnotation) {
        tree = new FunctionDeclaration(tree.location, tree.name, tree.functionKind, tree.parameterList, null, tree.annotations, tree.body);
      }
      return $__superGet(this, TypeTransformer.prototype, "transformFunctionDeclaration").call(this, tree);
    },
    transformFunctionExpression: function(tree) {
      if (tree.typeAnnotation) {
        tree = new FunctionExpression(tree.location, tree.name, tree.functionKind, tree.parameterList, null, tree.annotations, tree.body);
      }
      return $__superGet(this, TypeTransformer.prototype, "transformFunctionExpression").call(this, tree);
    },
    transformMethod: function(tree) {
      if (tree.typeAnnotation) {
        tree = new Method(tree.location, tree.isStatic, tree.functionKind, tree.name, tree.parameterList, null, tree.annotations, tree.body, tree.debugName);
      }
      return $__superGet(this, TypeTransformer.prototype, "transformMethod").call(this, tree);
    },
    transformGetAccessor: function(tree) {
      if (tree.typeAnnotation) {
        tree = new GetAccessor(tree.location, tree.isStatic, tree.name, null, tree.annotations, tree.body);
      }
      return $__superGet(this, TypeTransformer.prototype, "transformGetAccessor").call(this, tree);
    },
    transformInterfaceDeclaration: function(tree) {
      return new AnonBlock(null, []);
    },
    transformExportDeclaration: function(tree) {
      if (tree.declaration.type === TYPE_ALIAS_DECLARATION) {
        return new AnonBlock(null, []);
      }
      return $__superGet(this, TypeTransformer.prototype, "transformExportDeclaration").call(this, tree);
    },
    transformTypeAliasDeclaration: function(tree) {
      return new AnonBlock(null, []);
    },
    transformImportDeclaration: function(tree) {
      if (!tree.importClause || tree.importClause.type === IMPORT_TYPE_CLAUSE) {
        return new AnonBlock(null, []);
      }
      return $__superGet(this, TypeTransformer.prototype, "transformImportDeclaration").call(this, tree);
    }
  }, {}, $__super);
}(ParseTreeTransformer);
