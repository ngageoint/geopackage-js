"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  CloneTreeTransformer: {
    enumerable: true,
    get: function() {
      return CloneTreeTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__5 = require("../syntax/trees/ParseTrees.js"),
    BindingIdentifier = $__5.BindingIdentifier,
    BreakStatement = $__5.BreakStatement,
    ContinueStatement = $__5.ContinueStatement,
    DebuggerStatement = $__5.DebuggerStatement,
    EmptyStatement = $__5.EmptyStatement,
    ExportSpecifier = $__5.ExportSpecifier,
    ExportStar = $__5.ExportStar,
    IdentifierExpression = $__5.IdentifierExpression,
    LiteralExpression = $__5.LiteralExpression,
    ModuleSpecifier = $__5.ModuleSpecifier,
    PredefinedType = $__5.PredefinedType,
    PropertyNameShorthand = $__5.PropertyNameShorthand,
    TemplateLiteralPortion = $__5.TemplateLiteralPortion,
    SuperExpression = $__5.SuperExpression,
    ThisExpression = $__5.ThisExpression;
var CloneTreeTransformer = function($__super) {
  function CloneTreeTransformer() {
    $__superConstructor(CloneTreeTransformer).apply(this, arguments);
  }
  return ($__createClass)(CloneTreeTransformer, {
    transformBindingIdentifier: function(tree) {
      return new BindingIdentifier(tree.location, tree.identifierToken);
    },
    transformBreakStatement: function(tree) {
      return new BreakStatement(tree.location, tree.name);
    },
    transformContinueStatement: function(tree) {
      return new ContinueStatement(tree.location, tree.name);
    },
    transformDebuggerStatement: function(tree) {
      return new DebuggerStatement(tree.location);
    },
    transformEmptyStatement: function(tree) {
      return new EmptyStatement(tree.location);
    },
    transformExportSpecifier: function(tree) {
      return new ExportSpecifier(tree.location, tree.lhs, tree.rhs);
    },
    transformExportStar: function(tree) {
      return new ExportStar(tree.location);
    },
    transformIdentifierExpression: function(tree) {
      return new IdentifierExpression(tree.location, tree.identifierToken);
    },
    transformList: function(list) {
      if (!list) {
        return null;
      } else if (list.length === 0) {
        return [];
      } else {
        return $__superGet(this, CloneTreeTransformer.prototype, "transformList").call(this, list);
      }
    },
    transformLiteralExpression: function(tree) {
      return new LiteralExpression(tree.location, tree.literalToken);
    },
    transformModuleSpecifier: function(tree) {
      return new ModuleSpecifier(tree.location, tree.token);
    },
    transformPredefinedType: function(tree) {
      return new PredefinedType(tree.location, tree.typeToken);
    },
    transformPropertyNameShorthand: function(tree) {
      return new PropertyNameShorthand(tree.location, tree.name);
    },
    transformTemplateLiteralPortion: function(tree) {
      return new TemplateLiteralPortion(tree.location, tree.value);
    },
    transformSuperExpression: function(tree) {
      return new SuperExpression(tree.location);
    },
    transformThisExpression: function(tree) {
      return new ThisExpression(tree.location);
    }
  }, {}, $__super);
}(ParseTreeTransformer);
CloneTreeTransformer.cloneTree = function(tree) {
  return new CloneTreeTransformer().transformAny(tree);
};
