"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SpreadPropertiesTransformer: {
    enumerable: true,
    get: function() {
      return SpreadPropertiesTransformer;
    }
  },
  spreadProperties: {
    enumerable: true,
    get: function() {
      return spreadProperties;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var SPREAD_EXPRESSION = require("../syntax/trees/ParseTreeType.js").SPREAD_EXPRESSION;
var $__6 = require("./ParseTreeFactory.js"),
    createObjectLiteral = $__6.createObjectLiteral,
    createArgumentList = $__6.createArgumentList;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
function hasSpread(trees) {
  return trees.some(function(tree) {
    return tree && tree.type === SPREAD_EXPRESSION;
  });
}
var SpreadPropertiesTransformer = function($__super) {
  function SpreadPropertiesTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(SpreadPropertiesTransformer).call(this, identifierGenerator, reporter, options);
    this.options = options;
  }
  return ($__createClass)(SpreadPropertiesTransformer, {transformObjectLiteral: function(tree) {
      if (!hasSpread(tree.propertyNameAndValues)) {
        return $__superGet(this, SpreadPropertiesTransformer.prototype, "transformObjectLiteral").call(this, tree);
      }
      var properties = this.transformList(tree.propertyNameAndValues);
      return spreadProperties(properties, this);
    }}, {}, $__super);
}(ImportRuntimeTrait(ParseTreeTransformer));
function spreadProperties(properties, self) {
  var args = [];
  var accummulatedProps = null;
  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    if (property.type === SPREAD_EXPRESSION) {
      if (accummulatedProps) {
        args.push(createObjectLiteral(accummulatedProps));
        accummulatedProps = null;
      }
      args.push(property.expression);
    } else {
      if (!accummulatedProps) {
        accummulatedProps = [];
      }
      accummulatedProps.push(property);
    }
  }
  if (accummulatedProps) {
    args.push(createObjectLiteral(accummulatedProps));
  }
  var runtime = self.getRuntimeExpression('spreadProperties');
  return parseExpression($__getTemplateObject(["", "(", ")"]), runtime, createArgumentList(args));
}
