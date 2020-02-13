"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  parseExpression: {
    enumerable: true,
    get: function() {
      return parseExpression;
    }
  },
  parseStatement: {
    enumerable: true,
    get: function() {
      return parseStatement;
    }
  },
  parseModule: {
    enumerable: true,
    get: function() {
      return parseModule;
    }
  },
  parseScript: {
    enumerable: true,
    get: function() {
      return parseScript;
    }
  },
  parseStatements: {
    enumerable: true,
    get: function() {
      return parseStatements;
    }
  },
  parsePropertyDefinition: {
    enumerable: true,
    get: function() {
      return parsePropertyDefinition;
    }
  },
  PlaceholderTransformer: {
    enumerable: true,
    get: function() {
      return PlaceholderTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__5 = require("../syntax/trees/ParseTreeType.js"),
    ARGUMENT_LIST = $__5.ARGUMENT_LIST,
    BLOCK = $__5.BLOCK,
    EXPRESSION_STATEMENT = $__5.EXPRESSION_STATEMENT,
    FUNCTION_BODY = $__5.FUNCTION_BODY,
    IDENTIFIER_EXPRESSION = $__5.IDENTIFIER_EXPRESSION;
var IdentifierToken = require("../syntax/IdentifierToken.js").IdentifierToken;
var LiteralToken = require("../syntax/LiteralToken.js").LiteralToken;
var CollectingErrorReporter = require("../util/CollectingErrorReporter.js").CollectingErrorReporter;
var Options = require("../Options.js").Options;
var ParseTree = require("../syntax/trees/ParseTree.js").ParseTree;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var Parser = require("../syntax/Parser.js").Parser;
var $__13 = require("../syntax/trees/ParseTrees.js"),
    LiteralExpression = $__13.LiteralExpression,
    LiteralPropertyName = $__13.LiteralPropertyName,
    TypeName = $__13.TypeName;
var SourceFile = require("../syntax/SourceFile.js").SourceFile;
var IDENTIFIER = require("../syntax/TokenType.js").IDENTIFIER;
var $__16 = require("./ParseTreeFactory.js"),
    createArrayLiteral = $__16.createArrayLiteral,
    createBindingIdentifier = $__16.createBindingIdentifier,
    createBlock = $__16.createBlock,
    createBooleanLiteral = $__16.createBooleanLiteral,
    createCommaExpression = $__16.createCommaExpression,
    createExpressionStatement = $__16.createExpressionStatement,
    createFunctionBody = $__16.createFunctionBody,
    createIdentifierExpression = $__16.createIdentifierExpression,
    createIdentifierToken = $__16.createIdentifierToken,
    createMemberExpression = $__16.createMemberExpression,
    createNullLiteral = $__16.createNullLiteral,
    createNumberLiteral = $__16.createNumberLiteral,
    createParenExpression = $__16.createParenExpression,
    createStringLiteral = $__16.createStringLiteral,
    createVoid0 = $__16.createVoid0;
var NOT_FOUND = {};
function makeParseFunction(doParse) {
  var cache = new Map();
  return function(sourceLiterals) {
    for (var values = [],
        $__1 = 1; $__1 < arguments.length; $__1++)
      values[$__1 - 1] = arguments[$__1];
    return parse(sourceLiterals, values, doParse, cache);
  };
}
var parseExpression = makeParseFunction(function(p) {
  return p.parseExpression();
});
var parseStatement = makeParseFunction(function(p) {
  return p.parseStatement();
});
var parseModule = makeParseFunction(function(p) {
  return p.parseModule();
});
var parseScript = makeParseFunction(function(p) {
  return p.parseScript();
});
var parseStatements = makeParseFunction(function(p) {
  return p.parseStatements();
});
var parsePropertyDefinition = makeParseFunction(function(p) {
  return p.parsePropertyDefinition();
});
function parse(sourceLiterals, values, doParse, cache) {
  var tree = cache.get(sourceLiterals);
  if (!tree) {
    var source = insertPlaceholderIdentifiers(sourceLiterals);
    var errorReporter = new CollectingErrorReporter();
    var parser = getParser(source, errorReporter);
    tree = doParse(parser);
    if (errorReporter.hadError() || !tree || !parser.isAtEnd()) {
      throw new Error(("Internal error trying to parse:\n\n" + source + "\n\n" + errorReporter.errorsAsString()));
    }
    cache.set(sourceLiterals, tree);
  }
  if (!values.length)
    return tree;
  if (tree instanceof ParseTree)
    return new PlaceholderTransformer(values).transformAny(tree);
  return new PlaceholderTransformer(values).transformList(tree);
}
var PREFIX = '$__placeholder__';
function insertPlaceholderIdentifiers(sourceLiterals) {
  var source = sourceLiterals[0];
  for (var i = 1; i < sourceLiterals.length; i++) {
    source += PREFIX + String(i - 1) + sourceLiterals[i];
  }
  return source;
}
var counter = 0;
function getParser(source, errorReporter) {
  var file = new SourceFile(null, source);
  var options = new Options();
  options.experimental = true;
  return new Parser(file, errorReporter, options);
}
function convertValueToExpression(value) {
  if (value instanceof ParseTree)
    return value;
  if (value instanceof IdentifierToken)
    return createIdentifierExpression(value);
  if (value instanceof LiteralToken)
    return new LiteralExpression(value.location, value);
  if (Array.isArray(value)) {
    if (value[0] instanceof ParseTree) {
      if (value.length === 1)
        return value[0];
      if (value[0].isStatement())
        return createBlock(value);
      else
        return createParenExpression(createCommaExpression(value));
    }
    return createArrayLiteral(value.map(convertValueToExpression));
  }
  if (value === null)
    return createNullLiteral();
  if (value === undefined)
    return createVoid0();
  switch (typeof value) {
    case 'string':
      return createStringLiteral(value);
    case 'boolean':
      return createBooleanLiteral(value);
    case 'number':
      return createNumberLiteral(value);
  }
  throw new Error('Not implemented');
}
function convertValueToIdentifierToken(value) {
  if (value instanceof IdentifierToken)
    return value;
  return createIdentifierToken(value);
}
function convertValueToType(value) {
  if (value === null)
    return null;
  if (value instanceof ParseTree)
    return value;
  if (typeof value === 'string') {
    return new TypeName(null, null, convertValueToIdentifierToken(value));
  }
  if (value instanceof IdentifierToken) {
    return new TypeName(null, null, value);
  }
  throw new Error('Not implemented');
}
var PlaceholderTransformer = function($__super) {
  function PlaceholderTransformer(values) {
    $__superConstructor(PlaceholderTransformer).call(this);
    this.values = values;
  }
  return ($__createClass)(PlaceholderTransformer, {
    getValueAt: function(index) {
      return this.values[index];
    },
    getValue_: function(str) {
      if (str.indexOf(PREFIX) !== 0)
        return NOT_FOUND;
      return this.getValueAt(Number(str.slice(PREFIX.length)));
    },
    transformIdentifierExpression: function(tree) {
      var value = this.getValue_(tree.identifierToken.value);
      if (value === NOT_FOUND)
        return tree;
      return convertValueToExpression(value);
    },
    transformBindingIdentifier: function(tree) {
      var value = this.getValue_(tree.identifierToken.value);
      if (value === NOT_FOUND)
        return tree;
      return createBindingIdentifier(value);
    },
    transformExpressionStatement: function(tree) {
      if (tree.expression.type === IDENTIFIER_EXPRESSION) {
        var transformedExpression = this.transformIdentifierExpression(tree.expression);
        if (transformedExpression === tree.expression)
          return tree;
        if (transformedExpression.isStatementListItem() || transformedExpression.type === FUNCTION_BODY) {
          return transformedExpression;
        }
        return createExpressionStatement(transformedExpression);
      }
      return $__superGet(this, PlaceholderTransformer.prototype, "transformExpressionStatement").call(this, tree);
    },
    transformBlock: function(tree) {
      if (tree.statements.length === 1 && tree.statements[0].type === EXPRESSION_STATEMENT) {
        var transformedStatement = this.transformExpressionStatement(tree.statements[0]);
        if (transformedStatement === tree.statements[0])
          return tree;
        if (transformedStatement.type === BLOCK)
          return transformedStatement;
      }
      return $__superGet(this, PlaceholderTransformer.prototype, "transformBlock").call(this, tree);
    },
    transformFunctionBody: function(tree) {
      if (tree.statements.length === 1 && tree.statements[0].type === EXPRESSION_STATEMENT) {
        var transformedStatement = this.transformExpressionStatement(tree.statements[0]);
        if (transformedStatement.type === FUNCTION_BODY)
          return transformedStatement;
        if (transformedStatement === tree.statements[0])
          return tree;
        if (transformedStatement.type === BLOCK)
          return createFunctionBody(transformedStatement.statements);
      }
      return $__superGet(this, PlaceholderTransformer.prototype, "transformFunctionBody").call(this, tree);
    },
    transformMemberExpression: function(tree) {
      var value = this.getValue_(tree.memberName.value);
      if (value === NOT_FOUND)
        return $__superGet(this, PlaceholderTransformer.prototype, "transformMemberExpression").call(this, tree);
      var operand = this.transformAny(tree.operand);
      return createMemberExpression(operand, value);
    },
    transformLiteralPropertyName: function(tree) {
      if (tree.literalToken.type === IDENTIFIER) {
        var value = this.getValue_(tree.literalToken.value);
        if (value !== NOT_FOUND) {
          return new LiteralPropertyName(null, convertValueToIdentifierToken(value));
        }
      }
      return $__superGet(this, PlaceholderTransformer.prototype, "transformLiteralPropertyName").call(this, tree);
    },
    transformArgumentList: function(tree) {
      if (tree.args.length === 1 && tree.args[0].type === IDENTIFIER_EXPRESSION) {
        var arg0 = this.transformAny(tree.args[0]);
        if (arg0 === tree.args[0])
          return tree;
        if (arg0.type === ARGUMENT_LIST)
          return arg0;
      }
      return $__superGet(this, PlaceholderTransformer.prototype, "transformArgumentList").call(this, tree);
    },
    transformTypeName: function(tree) {
      var value = this.getValue_(tree.name.value);
      if (value === NOT_FOUND)
        return $__superGet(this, PlaceholderTransformer.prototype, "transformTypeName").call(this, tree);
      var moduleName = this.transformAny(tree.moduleName);
      if (moduleName !== null) {
        return new TypeName(null, moduleName, convertValueToIdentifierToken(value));
      }
      return convertValueToType(value);
    }
  }, {}, $__super);
}(ParseTreeTransformer);
