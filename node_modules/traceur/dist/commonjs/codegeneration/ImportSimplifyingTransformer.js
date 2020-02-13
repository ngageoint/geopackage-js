"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ImportSimplifyingTransformer: {
    enumerable: true,
    get: function() {
      return ImportSimplifyingTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__9 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__9.AnonBlock,
    ImportDeclaration = $__9.ImportDeclaration,
    ImportSpecifier = $__9.ImportSpecifier,
    ImportSpecifierSet = $__9.ImportSpecifierSet,
    Module = $__9.Module;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__11 = require("../syntax/trees/ParseTreeType.js"),
    ANON_BLOCK = $__11.ANON_BLOCK,
    IMPORT_CLAUSE_PAIR = $__11.IMPORT_CLAUSE_PAIR,
    IMPORT_DECLARATION = $__11.IMPORT_DECLARATION,
    IMPORT_SPECIFIER_SET = $__11.IMPORT_SPECIFIER_SET,
    IMPORTED_BINDING = $__11.IMPORTED_BINDING,
    NAME_SPACE_IMPORT = $__11.NAME_SPACE_IMPORT;
var createIdentifierToken = require("./ParseTreeFactory.js").createIdentifierToken;
var ImportSimplifyingTransformer = function($__super) {
  function ImportSimplifyingTransformer() {
    $__superConstructor(ImportSimplifyingTransformer).apply(this, arguments);
  }
  return ($__createClass)(ImportSimplifyingTransformer, {
    transformModule: function(tree) {
      var $__2;
      var statements = [];
      for (var i = 0; i < tree.scriptItemList.length; i++) {
        var item = tree.scriptItemList[i];
        switch (item.type) {
          case IMPORT_DECLARATION:
            {
              var transformed = this.transformAny(item);
              if (transformed.type === ANON_BLOCK) {
                ($__2 = statements).push.apply($__2, $__spread(transformed.statements));
              } else {
                statements.push(transformed);
              }
              break;
            }
          default:
            statements.push(item);
        }
      }
      return new Module(tree.location, statements, tree.moduleName);
    },
    transformImportDeclaration: function(tree) {
      var importClause = tree.importClause;
      if (importClause === null) {
        var set = new ImportSpecifierSet(null, []);
        return new ImportDeclaration(tree.location, set, tree.moduleSpecifier);
      }
      if (importClause.type === NAME_SPACE_IMPORT) {
        return tree;
      }
      if (importClause.type === IMPORTED_BINDING) {
        var specifier = this.transformAny(importClause);
        var set$__3 = new ImportSpecifierSet(null, [specifier]);
        return new ImportDeclaration(tree.location, set$__3, tree.moduleSpecifier);
      }
      if (importClause.type === IMPORT_CLAUSE_PAIR) {
        var $__1 = importClause,
            first = $__1.first,
            second = $__1.second;
        if (second.type === IMPORT_SPECIFIER_SET) {
          var defaultSpecifier = this.transformAny(first);
          var specifiers = $__spread([defaultSpecifier], second.specifiers);
          var set$__4 = new ImportSpecifierSet(first.location, specifiers);
          return new ImportDeclaration(tree.location, set$__4, tree.moduleSpecifier);
        }
        var firstImport = new ImportDeclaration(tree.location, first, tree.moduleSpecifier);
        firstImport = this.transformAny(firstImport);
        var secondImport = new ImportDeclaration(tree.location, second, tree.moduleSpecifier);
        return new AnonBlock(null, [firstImport, secondImport]);
      }
      return $__superGet(this, ImportSimplifyingTransformer.prototype, "transformImportDeclaration").call(this, tree);
    },
    transformImportSpecifier: function(tree) {
      return tree;
    },
    transformImportedBinding: function(tree) {
      var name = createIdentifierToken('default');
      return new ImportSpecifier(tree.location, tree, name);
    }
  }, {}, $__super);
}(ParseTreeTransformer);
