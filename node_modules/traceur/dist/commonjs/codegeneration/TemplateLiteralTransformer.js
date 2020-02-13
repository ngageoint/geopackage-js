"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  TemplateLiteralTransformer: {
    enumerable: true,
    get: function() {
      return TemplateLiteralTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__5 = require("../syntax/trees/ParseTreeType.js"),
    BINARY_EXPRESSION = $__5.BINARY_EXPRESSION,
    COMMA_EXPRESSION = $__5.COMMA_EXPRESSION,
    CONDITIONAL_EXPRESSION = $__5.CONDITIONAL_EXPRESSION,
    TEMPLATE_LITERAL_PORTION = $__5.TEMPLATE_LITERAL_PORTION,
    TEMPLATE_LITERAL_EXPRESSION = $__5.TEMPLATE_LITERAL_EXPRESSION;
var $__6 = require("../syntax/trees/ParseTrees.js"),
    LiteralExpression = $__6.LiteralExpression,
    NewExpression = $__6.NewExpression;
var LiteralToken = require("../syntax/LiteralToken.js").LiteralToken;
var ParenTrait = require("./ParenTrait.js").ParenTrait;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var $__11 = require("../syntax/TokenType.js"),
    PERCENT = $__11.PERCENT,
    PLUS = $__11.PLUS,
    SLASH = $__11.SLASH,
    STAR = $__11.STAR,
    STRING = $__11.STRING;
var $__12 = require("./ParseTreeFactory.js"),
    createArgumentList = $__12.createArgumentList,
    createArrayLiteral = $__12.createArrayLiteral,
    createBinaryExpression = $__12.createBinaryExpression,
    createCallExpression = $__12.createCallExpression,
    createMemberExpression = $__12.createMemberExpression,
    createOperatorToken = $__12.createOperatorToken,
    createParenExpression = $__12.createParenExpression;
function createStringLiteralExpression(loc, str) {
  return new LiteralExpression(loc, new LiteralToken(STRING, str, loc));
}
function createGetTemplateObject(elements, getTemplateObject) {
  var cooked = [];
  var raw = [];
  var same = true;
  for (var i = 0; i < elements.length; i += 2) {
    var loc = elements[i].location;
    var str = elements[i].value.value;
    var cookedStr = toCookedString(str);
    var rawStr = toRawString(str);
    var cookedLiteral$__1 = createStringLiteralExpression(loc, cookedStr);
    cooked.push(cookedLiteral$__1);
    if (cookedStr !== rawStr) {
      same = false;
      var rawLiteral = createStringLiteralExpression(loc, rawStr);
      raw.push(rawLiteral);
    } else {
      raw.push(cookedLiteral$__1);
    }
  }
  maybeAddEmptyStringAtEnd(elements, cooked);
  var cookedLiteral = createArrayLiteral(cooked);
  var args = [cookedLiteral];
  if (!same) {
    maybeAddEmptyStringAtEnd(elements, raw);
    var rawLiteral$__2 = createArrayLiteral(raw);
    args.unshift(rawLiteral$__2);
  }
  return createCallExpression(getTemplateObject, createArgumentList(args));
}
function maybeAddEmptyStringAtEnd(elements, items) {
  var length = elements.length;
  if (!length || elements[length - 1].type !== TEMPLATE_LITERAL_PORTION) {
    items.push(createStringLiteralExpression(null, '""'));
  }
}
function toRawString(str) {
  str = str.replace(/\r\n?/g, '\n');
  str = JSON.stringify(str);
  return str.replace(/\u2028|\u2029/g, function(c) {
    switch (c) {
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default:
        throw Error('Not reachable');
    }
  });
}
function toCookedString(s) {
  var sb = ['"'];
  var i = 0,
      k = 1,
      c,
      c2;
  while (i < s.length) {
    c = s[i++];
    switch (c) {
      case '\\':
        c2 = s[i++];
        switch (c2) {
          case '\n':
          case '\u2028':
          case '\u2029':
            break;
          case '\r':
            if (s[i + 1] === '\n') {
              i++;
            }
            break;
          default:
            sb[k++] = c;
            sb[k++] = c2;
        }
        break;
      case '"':
        sb[k++] = '\\"';
        break;
      case '\n':
        sb[k++] = '\\n';
        break;
      case '\r':
        if (s[i] === '\n')
          i++;
        sb[k++] = '\\n';
        break;
      case '\t':
        sb[k++] = '\\t';
        break;
      case '\f':
        sb[k++] = '\\f';
        break;
      case '\b':
        sb[k++] = '\\b';
        break;
      case '\u2028':
        sb[k++] = '\\u2028';
        break;
      case '\u2029':
        sb[k++] = '\\u2029';
        break;
      default:
        sb[k++] = c;
    }
  }
  sb[k++] = '"';
  return sb.join('');
}
var TemplateLiteralTransformer = function($__super) {
  function TemplateLiteralTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(TemplateLiteralTransformer).call(this);
    this.options = options;
  }
  return ($__createClass)(TemplateLiteralTransformer, {
    transformTemplateLiteralExpression: function(tree) {
      if (!tree.operand) {
        return this.createDefaultTemplateLiteral(tree);
      }
      var operand = this.transformAny(tree.operand);
      var elements = tree.elements;
      var getTemplateObject = this.getRuntimeExpression('getTemplateObject');
      var args = [createGetTemplateObject(tree.elements, getTemplateObject)];
      for (var i = 1; i < elements.length; i += 2) {
        args.push(this.transformAny(elements[i]));
      }
      return createCallExpression(operand, createArgumentList(args));
    },
    transformTemplateSubstitution: function(tree) {
      var transformedTree = this.transformAny(tree.expression);
      switch (transformedTree.type) {
        case BINARY_EXPRESSION:
          switch (transformedTree.operator.type) {
            case STAR:
            case PERCENT:
            case SLASH:
              return transformedTree;
          }
          return createParenExpression(transformedTree);
        case COMMA_EXPRESSION:
        case CONDITIONAL_EXPRESSION:
          return createParenExpression(transformedTree);
      }
      return transformedTree;
    },
    transformTemplateLiteralPortion: function(tree) {
      var str = toCookedString(tree.value.value);
      return createStringLiteralExpression(tree.location, str);
    },
    createDefaultTemplateLiteral: function(tree) {
      var elements = tree.elements;
      var length = elements.length;
      if (length === 0) {
        return createStringLiteralExpression(tree.location, '""');
      }
      var firstNonEmpty = elements[0].value.value === '';
      var binaryExpression = this.transformAny(elements[0]);
      if (length === 1)
        return binaryExpression;
      var plusToken = createOperatorToken(PLUS);
      for (var i = 1; i < length; i++) {
        var element = elements[i];
        if (element.type === TEMPLATE_LITERAL_PORTION) {
          if (element.value.value === '') {
            continue;
          }
          if (firstNonEmpty && i === 2) {
            binaryExpression = binaryExpression.right;
          }
        }
        var transformedTree = this.transformAny(elements[i]);
        binaryExpression = createBinaryExpression(binaryExpression, plusToken, transformedTree);
      }
      return new createParenExpression(binaryExpression);
    }
  }, {}, $__super);
}(ImportRuntimeTrait(ParenTrait(ParseTreeTransformer)));
