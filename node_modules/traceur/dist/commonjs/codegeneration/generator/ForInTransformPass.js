"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ForInTransformPass: {
    enumerable: true,
    get: function() {
      return ForInTransformPass;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__6 = require("../../syntax/trees/ParseTreeType.js"),
    BLOCK = $__6.BLOCK,
    VARIABLE_DECLARATION_LIST = $__6.VARIABLE_DECLARATION_LIST,
    IDENTIFIER_EXPRESSION = $__6.IDENTIFIER_EXPRESSION;
var $__7 = require("../../syntax/PredefinedName.js"),
    LENGTH = $__7.LENGTH,
    PUSH = $__7.PUSH;
var TempVarTransformer = require("../TempVarTransformer.js").TempVarTransformer;
var $__9 = require("../../syntax/TokenType.js"),
    BANG = $__9.BANG,
    IN = $__9.IN,
    OPEN_ANGLE = $__9.OPEN_ANGLE,
    PLUS_PLUS = $__9.PLUS_PLUS,
    VAR = $__9.VAR;
var $__10 = require("../ParseTreeFactory.js"),
    createArgumentList = $__10.createArgumentList,
    createAssignmentStatement = $__10.createAssignmentStatement,
    createBinaryExpression = $__10.createBinaryExpression,
    createBlock = $__10.createBlock,
    createCallStatement = $__10.createCallStatement,
    createContinueStatement = $__10.createContinueStatement,
    createEmptyArrayLiteral = $__10.createEmptyArrayLiteral,
    createForInStatement = $__10.createForInStatement,
    createForStatement = $__10.createForStatement,
    createIdentifierExpression = $__10.createIdentifierExpression,
    createIfStatement = $__10.createIfStatement,
    createMemberExpression = $__10.createMemberExpression,
    createMemberLookupExpression = $__10.createMemberLookupExpression,
    createNumberLiteral = $__10.createNumberLiteral,
    createOperatorToken = $__10.createOperatorToken,
    createParenExpression = $__10.createParenExpression,
    createPostfixExpression = $__10.createPostfixExpression,
    createUnaryExpression = $__10.createUnaryExpression,
    createVariableDeclarationList = $__10.createVariableDeclarationList,
    createVariableStatement = $__10.createVariableStatement;
var ForInTransformPass = function($__super) {
  function ForInTransformPass() {
    $__superConstructor(ForInTransformPass).apply(this, arguments);
  }
  return ($__createClass)(ForInTransformPass, {transformForInStatement: function(tree) {
      var $__1,
          $__2;
      var bodyStatements = [];
      var body = this.transformAny(tree.body);
      if (body.type === BLOCK) {
        ($__1 = bodyStatements).push.apply($__1, $__spread(body.statements));
      } else {
        bodyStatements.push(body);
      }
      var elements = [];
      var keys = this.getTempIdentifier();
      elements.push(createVariableStatement(VAR, keys, createEmptyArrayLiteral()));
      var collection = this.getTempIdentifier();
      elements.push(createVariableStatement(VAR, collection, tree.collection));
      var p = this.getTempIdentifier();
      elements.push(createForInStatement(createVariableDeclarationList(VAR, p, null), createIdentifierExpression(collection), createCallStatement(createMemberExpression(keys, PUSH), createArgumentList([createIdentifierExpression(p)]))));
      var i = this.getTempIdentifier();
      var lookup = createMemberLookupExpression(createIdentifierExpression(keys), createIdentifierExpression(i));
      var originalKey,
          assignOriginalKey;
      if (tree.initializer.type === VARIABLE_DECLARATION_LIST) {
        var decList = tree.initializer;
        originalKey = createIdentifierExpression(decList.declarations[0].lvalue);
        assignOriginalKey = createVariableStatement(decList.declarationType, originalKey.identifierToken, lookup);
      } else if (tree.initializer.type === IDENTIFIER_EXPRESSION) {
        originalKey = tree.initializer;
        assignOriginalKey = createAssignmentStatement(tree.initializer, lookup);
      } else {
        throw new Error('Invalid left hand side of for in loop');
      }
      var innerBlock = [];
      innerBlock.push(assignOriginalKey);
      innerBlock.push(createIfStatement(createUnaryExpression(createOperatorToken(BANG), createParenExpression(createBinaryExpression(originalKey, createOperatorToken(IN), createIdentifierExpression(collection)))), createContinueStatement(), null));
      ($__2 = innerBlock).push.apply($__2, $__spread(bodyStatements));
      elements.push(createForStatement(createVariableDeclarationList(VAR, i, createNumberLiteral(0)), createBinaryExpression(createIdentifierExpression(i), createOperatorToken(OPEN_ANGLE), createMemberExpression(keys, LENGTH)), createPostfixExpression(createIdentifierExpression(i), createOperatorToken(PLUS_PLUS)), createBlock(innerBlock)));
      return createBlock(elements);
    }}, {}, $__super);
}(TempVarTransformer);
