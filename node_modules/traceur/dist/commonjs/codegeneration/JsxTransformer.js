"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  JsxTransformer: {
    enumerable: true,
    get: function() {
      return JsxTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__8 = require("../syntax/trees/ParseTreeType.js"),
    JSX_ELEMENT = $__8.JSX_ELEMENT,
    JSX_PLACEHOLDER = $__8.JSX_PLACEHOLDER,
    JSX_SPREAD_ATTRIBUTE = $__8.JSX_SPREAD_ATTRIBUTE,
    JSX_TEXT = $__8.JSX_TEXT,
    LITERAL_EXPRESSION = $__8.LITERAL_EXPRESSION;
var $__9 = require("../syntax/trees/ParseTrees.js"),
    JsxText = $__9.JsxText,
    LiteralExpression = $__9.LiteralExpression,
    LiteralPropertyName = $__9.LiteralPropertyName,
    SpreadExpression = $__9.SpreadExpression;
var LiteralToken = require("../syntax/LiteralToken.js").LiteralToken;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var STRING = require("../syntax/TokenType.js").STRING;
var $__13 = require("./ParseTreeFactory.js"),
    createArgumentList = $__13.createArgumentList,
    createIdentifierExpression = $__13.createIdentifierExpression,
    createIdentifierToken = $__13.createIdentifierToken,
    createMemberExpression = $__13.createMemberExpression,
    createNullLiteral = $__13.createNullLiteral,
    createObjectLiteral = $__13.createObjectLiteral,
    createPropertyNameAssignment = $__13.createPropertyNameAssignment,
    createStringLiteral = $__13.createStringLiteral,
    createStringLiteralToken = $__13.createStringLiteralToken,
    createTrueLiteral = $__13.createTrueLiteral;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var spreadProperties = require("./SpreadPropertiesTransformer.js").spreadProperties;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var JsxTransformer = function($__super) {
  function JsxTransformer(idGen, reporter, options) {
    $__superConstructor(JsxTransformer).call(this);
    this.options = options;
    this.jsxFunction_ = null;
  }
  return ($__createClass)(JsxTransformer, {
    getJsxFunction_: function() {
      if (!this.jsxFunction_) {
        var jsx = this.options.jsx;
        if (typeof jsx === 'string') {
          this.jsxFunction_ = parseExpression([jsx]);
        } else {
          this.jsxFunction_ = parseExpression($__getTemplateObject(["React.createElement"]));
        }
      }
      return this.jsxFunction_;
    },
    transformJsxElement: function(tree) {
      var name = this.transformAny(tree.name);
      var props = this.transformJsxAttributes_(tree);
      var children = this.transformJsxChildren_(tree.children);
      var args = createArgumentList($__spread([name, props], children));
      return parseExpression($__getTemplateObject(["", "(", ")"]), this.getJsxFunction_(), args);
    },
    transformJsxAttributes_: function(tree) {
      var attrs = this.transformList(tree.attributes);
      if (attrs.length === 0) {
        return createNullLiteral();
      }
      if (tree.attributes.some(function(a) {
        return a.type === JSX_SPREAD_ATTRIBUTE;
      })) {
        return spreadProperties(attrs, this);
      }
      return createObjectLiteral(attrs);
    },
    transformJsxElementName: function(tree) {
      if (tree.names.length === 1) {
        var value = tree.names[0].value;
        if (value[0] === value[0].toUpperCase()) {
          return createIdentifierExpression(value);
          ;
        }
        return createStringLiteral(value);
      }
      var names = tree.names.map(jsxIdentifierToToken);
      var operand = names[0];
      if (operand.type === STRING) {
        names[0] = new LiteralExpression(operand.location, operand);
      }
      return createMemberExpression.apply((void 0), $__spread(names));
    },
    transformJsxAttribute: function(tree) {
      var name = new LiteralPropertyName(tree.name.location, jsxIdentifierToToken(tree.name));
      var value;
      if (tree.value === null) {
        value = createTrueLiteral();
      } else if (tree.value.type === LITERAL_EXPRESSION) {
        var literalToken = tree.value.literalToken;
        var v = literalToken.value;
        var location = literalToken.location;
        var lit = new LiteralToken(STRING, normalizeAttributeValue(v), location);
        value = new LiteralExpression(location, lit);
      } else {
        value = this.transformAny(tree.value);
      }
      return createPropertyNameAssignment(name, value);
    },
    transformJsxPlaceholder: function(tree) {
      return this.transformAny(tree.expression);
    },
    transformJsxSpreadAttribute: function(tree) {
      return new SpreadExpression(tree.location, this.transformAny(tree.expression));
    },
    transformJsxText: function(tree) {
      return createStringLiteral(tree.value.value);
    },
    transformJsxChildren_: function(trees) {
      var $__1 = this;
      var rv = [];
      trees.forEach(function(tree) {
        var newTree;
        switch (tree.type) {
          case JSX_ELEMENT:
            newTree = $__1.transformAny(tree);
            break;
          case JSX_PLACEHOLDER:
            if (tree.expression === null) {
              return;
            }
            newTree = $__1.transformAny(tree);
            break;
          case JSX_TEXT:
            {
              var s = tree.value.value;
              s = s.replace(/\t/g, ' ');
              if (!/[\n\r]/.test(s)) {
                newTree = createStringLiteral(s);
              } else {
                s = s.replace(/^[ \t]*[\n\r]\s*/, '');
                s = s.replace(/[ \t]*[\n\r]\s*$/, '');
                if (s === '') {
                  return;
                }
                newTree = createStringLiteral(s);
              }
              break;
            }
        }
        rv.push(newTree);
      });
      return rv;
    }
  }, {}, $__super);
}(ImportRuntimeTrait(ParseTreeTransformer));
function jsxIdentifierToToken(token) {
  var value = token.value;
  if (value.indexOf('-') !== -1) {
    return createStringLiteralToken(value);
  }
  return createIdentifierToken(value);
}
function normalizeAttributeValue(s) {
  return JSON.stringify(s.slice(1, -1).replace(/\n\s+/g, ' '));
}
