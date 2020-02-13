"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  MemberVariableTransformer: {
    enumerable: true,
    get: function() {
      return MemberVariableTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var CONSTRUCTOR = require("../syntax/PredefinedName.js").CONSTRUCTOR;
var $__9 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__9.AnonBlock,
    ClassDeclaration = $__9.ClassDeclaration,
    ClassExpression = $__9.ClassExpression,
    FormalParameterList = $__9.FormalParameterList,
    IdentifierExpression = $__9.IdentifierExpression,
    Method = $__9.Method,
    ReturnStatement = $__9.ReturnStatement;
var $__10 = require("../syntax/trees/ParseTreeType.js"),
    GET_ACCESSOR = $__10.GET_ACCESSOR,
    METHOD = $__10.METHOD,
    PROPERTY_VARIABLE_DECLARATION = $__10.PROPERTY_VARIABLE_DECLARATION,
    SET_ACCESSOR = $__10.SET_ACCESSOR;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__12 = require("./ParseTreeFactory.js"),
    createCommaExpression = $__12.createCommaExpression,
    createFunctionBody = $__12.createFunctionBody,
    createIdentifierToken = $__12.createIdentifierToken,
    createImmediatelyInvokedFunctionExpression = $__12.createImmediatelyInvokedFunctionExpression,
    createLiteralPropertyName = $__12.createLiteralPropertyName,
    createRestParameter = $__12.createRestParameter;
var $__13 = require("./PlaceholderParser.js"),
    parsePropertyDefinition = $__13.parsePropertyDefinition,
    parseStatement = $__13.parseStatement;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var prependStatements = require("./PrependStatements.js").prependStatements;
var propName = require("../staticsemantics/PropName.js").propName;
var transformConstructor = require("./MemberVariableConstructorTransformer.js").transformConstructor;
var MemberVariableTransformer = function($__super) {
  function MemberVariableTransformer() {
    $__superConstructor(MemberVariableTransformer).apply(this, arguments);
  }
  return ($__createClass)(MemberVariableTransformer, {
    transformClassElements_: function(tree) {
      var $__2 = this;
      var elements = [];
      var initInstanceVars = [],
          initStaticVars = [];
      var constructor;
      var constructorIndex = 0;
      tree.elements.forEach(function(tree) {
        var initVars;
        if (tree.isStatic) {
          initVars = initStaticVars;
        } else {
          initVars = initInstanceVars;
        }
        switch (tree.type) {
          case GET_ACCESSOR:
          case SET_ACCESSOR:
            elements.push($__2.transformAny(tree));
            break;
          case METHOD:
            if (!tree.isStatic && propName(tree) === CONSTRUCTOR) {
              constructor = tree;
              constructorIndex = elements.length;
            } else {
              elements.push($__2.transformAny(tree));
            }
            break;
          case PROPERTY_VARIABLE_DECLARATION:
            tree = $__2.transformAny(tree);
            if (tree.initializer !== null) {
              initVars.push(tree);
            }
            break;
          default:
            throw new Error(("Unexpected class element: " + tree.type));
        }
      });
      if (initInstanceVars.length > 0) {
        var initExpression = getInstanceInitExpression(initInstanceVars);
        if (!constructor) {
          constructor = this.getDefaultConstructor_(tree);
        }
        constructor = transformConstructor(constructor, initExpression, tree.superClass);
      }
      if (constructor) {
        elements.splice(constructorIndex, 0, constructor);
      }
      return {
        elements: elements,
        initStaticVars: initStaticVars
      };
    },
    transformClassDeclaration: function(tree) {
      var $__3 = this.transformClassElements_(tree),
          elements = $__3.elements,
          initStaticVars = $__3.initStaticVars;
      var superClass = this.transformAny(tree.superClass);
      var classDecl = new ClassDeclaration(tree.location, tree.name, superClass, elements, tree.annotations, tree.typeParameters);
      if (initStaticVars.length === 0) {
        return classDecl;
      }
      var statements = createStaticInitializerStatements(tree.name.identifierToken, initStaticVars);
      statements = prependStatements(statements, classDecl);
      return new AnonBlock(null, statements);
    },
    transformClassExpression: function(tree) {
      var $__3 = this.transformClassElements_(tree),
          elements = $__3.elements,
          initStaticVars = $__3.initStaticVars;
      var superClass = this.transformAny(tree.superClass);
      var classExpression = new ClassExpression(tree.location, tree.name, superClass, elements, tree.annotations, tree.typeParameters);
      if (initStaticVars.length === 0) {
        return classExpression;
      }
      this.pushTempScope();
      var id = this.getTempIdentifier();
      var idToken = createIdentifierToken(id);
      var idExpression = new IdentifierExpression(idToken.location, idToken);
      var statements = $__spread([parseStatement($__getTemplateObject(["let ", " = ", ""]), id, classExpression)], createStaticInitializerStatements(idToken, initStaticVars), [new ReturnStatement(null, idExpression)]);
      var body = createFunctionBody(statements);
      this.popTempScope();
      return createImmediatelyInvokedFunctionExpression(body);
    },
    getDefaultConstructor_: function(tree) {
      if (tree.superClass) {
        var param = createRestParameter(createIdentifierToken('args'));
        var paramList = new FormalParameterList(null, [param]);
        var body = createFunctionBody([parseStatement($__getTemplateObject(["super(...args)"]))]);
        var name = createLiteralPropertyName(CONSTRUCTOR);
        return new Method(tree.location, false, null, name, paramList, null, [], body, null);
      }
      return parsePropertyDefinition($__getTemplateObject(["constructor() {}"]));
    }
  }, {}, $__super);
}(TempVarTransformer);
function createStaticInitializerStatements(idToken, initStaticMemberVars) {
  var className = new IdentifierExpression(idToken.location, idToken);
  return initStaticMemberVars.map(function(mv) {
    var propName = mv.name.literalToken.value;
    return parseStatement($__getTemplateObject(["Object.defineProperty(", ", ", ", {enumerable: true,\n        configurable: true, value: ", ", writable: true})"]), className, propName, mv.initializer);
  });
}
function getInstanceInitExpression(initInstanceVars) {
  var expressions = initInstanceVars.map(function(mv) {
    var name = mv.name.literalToken;
    return parseExpression($__getTemplateObject(["this.", " = ", ""]), name, mv.initializer);
  });
  return createCommaExpression(expressions);
}
