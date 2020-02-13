"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SpreadTransformer: {
    enumerable: true,
    get: function() {
      return SpreadTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__8 = require("../syntax/PredefinedName.js"),
    APPLY = $__8.APPLY,
    BIND = $__8.BIND,
    FUNCTION = $__8.FUNCTION,
    PROTOTYPE = $__8.PROTOTYPE;
var $__9 = require("../syntax/trees/ParseTreeType.js"),
    MEMBER_EXPRESSION = $__9.MEMBER_EXPRESSION,
    MEMBER_LOOKUP_EXPRESSION = $__9.MEMBER_LOOKUP_EXPRESSION,
    SPREAD_EXPRESSION = $__9.SPREAD_EXPRESSION;
var Script = require("../syntax/trees/ParseTrees.js").Script;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var $__13 = require("./ParseTreeFactory.js"),
    createArgumentList = $__13.createArgumentList,
    createArrayLiteral = $__13.createArrayLiteral,
    createAssignmentExpression = $__13.createAssignmentExpression,
    createCallExpression = $__13.createCallExpression,
    createEmptyArgumentList = $__13.createEmptyArgumentList,
    createIdentifierExpression = $__13.createIdentifierExpression,
    createMemberExpression = $__13.createMemberExpression,
    createMemberLookupExpression = $__13.createMemberLookupExpression,
    createNewExpression = $__13.createNewExpression,
    createNullLiteral = $__13.createNullLiteral,
    createParenExpression = $__13.createParenExpression,
    createVoid0 = $__13.createVoid0;
var $__14 = require("./PlaceholderParser.js"),
    parseExpression = $__14.parseExpression,
    parseStatement = $__14.parseStatement;
var prependStatements = require("./PrependStatements.js").prependStatements;
function hasSpreadMember(trees) {
  return trees.some(function(tree) {
    return tree && tree.type === SPREAD_EXPRESSION;
  });
}
var SpreadTransformer = function($__super) {
  function SpreadTransformer() {
    $__superConstructor(SpreadTransformer).apply(this, arguments);
  }
  return ($__createClass)(SpreadTransformer, {
    createArrayFromElements_: function(elements) {
      var length = elements.length;
      var args = [];
      var lastArray;
      for (var i = 0; i < length; i++) {
        if (elements[i] && elements[i].type === SPREAD_EXPRESSION) {
          if (lastArray) {
            args.push(createArrayLiteral(lastArray));
            lastArray = null;
          }
          args.push(this.transformAny(elements[i].expression));
        } else {
          if (!lastArray)
            lastArray = [];
          lastArray.push(this.transformAny(elements[i]));
        }
      }
      if (lastArray)
        args.push(createArrayLiteral(lastArray));
      var spread = this.getRuntimeExpression('spread');
      return parseExpression($__getTemplateObject(["", "(", ")"]), spread, createArgumentList(args));
    },
    desugarCallSpread_: function(tree) {
      var operand = this.transformAny(tree.operand);
      var functionObject,
          contextObject;
      this.pushTempScope();
      if (operand.type === MEMBER_EXPRESSION) {
        var tempIdent = createIdentifierExpression(this.addTempVar());
        var parenExpression = createParenExpression(createAssignmentExpression(tempIdent, operand.operand));
        var memberName = operand.memberName;
        contextObject = tempIdent;
        functionObject = createMemberExpression(parenExpression, memberName);
      } else if (tree.operand.type === MEMBER_LOOKUP_EXPRESSION) {
        var tempIdent$__1 = createIdentifierExpression(this.addTempVar());
        var parenExpression$__2 = createParenExpression(createAssignmentExpression(tempIdent$__1, operand.operand));
        var memberExpression = this.transformAny(operand.memberExpression);
        contextObject = tempIdent$__1;
        functionObject = createMemberLookupExpression(parenExpression$__2, memberExpression);
      } else {
        contextObject = createVoid0();
        functionObject = operand;
      }
      this.popTempScope();
      var arrayExpression = this.createArrayFromElements_(tree.args.args);
      return createCallExpression(createMemberExpression(functionObject, APPLY), createArgumentList([contextObject, arrayExpression]));
    },
    desugarNewSpread_: function(tree) {
      var arrayExpression = $__spread([createNullLiteral()], tree.args.args);
      arrayExpression = this.createArrayFromElements_(arrayExpression);
      return createNewExpression(createParenExpression(createCallExpression(createMemberExpression(FUNCTION, PROTOTYPE, BIND, APPLY), createArgumentList([this.transformAny(tree.operand), arrayExpression]))), createEmptyArgumentList());
    },
    transformArrayLiteral: function(tree) {
      if (hasSpreadMember(tree.elements)) {
        return this.createArrayFromElements_(tree.elements);
      }
      return $__superGet(this, SpreadTransformer.prototype, "transformArrayLiteral").call(this, tree);
    },
    transformCallExpression: function(tree) {
      if (hasSpreadMember(tree.args.args)) {
        return this.desugarCallSpread_(tree);
      }
      return $__superGet(this, SpreadTransformer.prototype, "transformCallExpression").call(this, tree);
    },
    transformNewExpression: function(tree) {
      if (tree.args !== null && hasSpreadMember(tree.args.args)) {
        return this.desugarNewSpread_(tree);
      }
      return $__superGet(this, SpreadTransformer.prototype, "transformNewExpression").call(this, tree);
    }
  }, {}, $__super);
}(ImportRuntimeTrait(TempVarTransformer));
