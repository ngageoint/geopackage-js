"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ClassTransformer: {
    enumerable: true,
    get: function() {
      return ClassTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var CONSTRUCTOR = require("../syntax/PredefinedName.js").CONSTRUCTOR;
var $__7 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__7.AnonBlock,
    ClassExpression = $__7.ClassExpression,
    ExportDeclaration = $__7.ExportDeclaration,
    ExportSpecifier = $__7.ExportSpecifier,
    ExportSpecifierSet = $__7.ExportSpecifierSet,
    FunctionDeclaration = $__7.FunctionDeclaration,
    FunctionExpression = $__7.FunctionExpression,
    GetAccessor = $__7.GetAccessor,
    Method = $__7.Method,
    NamedExport = $__7.NamedExport,
    SetAccessor = $__7.SetAccessor;
var $__8 = require("../syntax/trees/ParseTreeType.js"),
    CLASS_DECLARATION = $__8.CLASS_DECLARATION,
    COMPUTED_PROPERTY_NAME = $__8.COMPUTED_PROPERTY_NAME,
    EXPORT_DEFAULT = $__8.EXPORT_DEFAULT,
    GET_ACCESSOR = $__8.GET_ACCESSOR,
    LITERAL_PROPERTY_NAME = $__8.LITERAL_PROPERTY_NAME,
    METHOD = $__8.METHOD,
    SET_ACCESSOR = $__8.SET_ACCESSOR;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__10 = require("../syntax/TokenType.js"),
    CONST = $__10.CONST,
    LET = $__10.LET,
    VAR = $__10.VAR,
    STRING = $__10.STRING;
var MakeStrictTransformer = require("./MakeStrictTransformer.js").MakeStrictTransformer;
var ParenTrait = require("./ParenTrait.js").ParenTrait;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var $__14 = require("./ParseTreeFactory.js"),
    createBindingIdentifier = $__14.createBindingIdentifier,
    id = $__14.createIdentifierExpression,
    createIdentifierToken = $__14.createIdentifierToken,
    createObjectLiteral = $__14.createObjectLiteral,
    createVariableStatement = $__14.createVariableStatement;
var hasUseStrict = require("../semantics/util.js").hasUseStrict;
var $__16 = require("./PlaceholderParser.js"),
    parseExpression = $__16.parseExpression,
    parsePropertyDefinition = $__16.parsePropertyDefinition,
    parseStatement = $__16.parseStatement;
function methodNameFromTree(tree) {
  if (tree.type === COMPUTED_PROPERTY_NAME) {
    return '';
  }
  if (tree.literalToken && tree.literalToken.type === STRING) {
    return tree.getStringValue().substr(1, -1);
  }
  return tree.getStringValue();
}
function classMethodDebugName(className, methodName, isStatic) {
  if (isStatic) {
    return createBindingIdentifier('$__' + className + '_' + methodName);
  }
  return createBindingIdentifier('$__' + className + '_prototype_' + methodName);
}
function functionExpressionToDeclaration(tree, name) {
  if (tree.name === null) {
    name = createBindingIdentifier(name);
  } else {
    name = tree.name;
  }
  return new FunctionDeclaration(tree.location, name, tree.functionKind, tree.parameterList, tree.typeAnnotation, tree.annotations, tree.body);
}
function removeStaticModifier(tree) {
  switch (tree.type) {
    case GET_ACCESSOR:
      return new GetAccessor(tree.location, false, tree.name, tree.typeAnnotation, tree.annotations, tree.body);
    case SET_ACCESSOR:
      return new SetAccessor(tree.location, false, tree.name, tree.parameterList, tree.annotations, tree.body);
    case METHOD:
      return new Method(tree.location, false, tree.functionKind, tree.name, tree.parameterList, tree.typeAnnotation, tree.annotations, tree.body, tree.debugName);
    default:
      throw new Error('unreachable');
  }
}
function isConstructor(tree) {
  if (tree.type !== METHOD || tree.isStatic || tree.functionKind !== null) {
    return false;
  }
  var name = tree.name;
  return name.type === LITERAL_PROPERTY_NAME && name.literalToken.value === CONSTRUCTOR;
}
var ClassTransformer = function($__super) {
  function ClassTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(ClassTransformer).call(this, identifierGenerator, reporter, options);
    this.strictCount_ = 0;
    this.state_ = null;
  }
  return ($__createClass)(ClassTransformer, {
    transformModule: function(tree) {
      this.strictCount_ = 1;
      return $__superGet(this, ClassTransformer.prototype, "transformModule").call(this, tree);
    },
    transformScript: function(tree) {
      this.strictCount_ = hasUseStrict(tree.scriptItemList) ? 1 : 0;
      return $__superGet(this, ClassTransformer.prototype, "transformScript").call(this, tree);
    },
    transformFunctionBody: function(tree) {
      var useStrict = hasUseStrict(tree.statements) ? 1 : 0;
      this.strictCount_ += useStrict;
      var result = $__superGet(this, ClassTransformer.prototype, "transformFunctionBody").call(this, tree);
      this.strictCount_ -= useStrict;
      return result;
    },
    makeStrict_: function(tree) {
      if (this.strictCount_)
        return tree;
      return MakeStrictTransformer.transformTree(tree);
    },
    transformClassDeclaration: function(tree) {
      var classExpression = new ClassExpression(tree.location, tree.name, tree.superClass, tree.elements, tree.annotations, tree.typeParameters);
      var transformed = this.transformClassExpression(classExpression);
      var useLet = !this.options.transformOptions.blockBinding && this.options.parseOptions.blockBinding;
      return createVariableStatement(useLet ? LET : VAR, tree.name, transformed);
    },
    transformClassExpression: function(tree) {
      var superClass = this.transformAny(tree.superClass);
      var elements = this.transformList(tree.elements);
      var annotations = this.transformList(tree.annotations);
      var constructor = null;
      var protoElements = elements.filter(function(tree) {
        if (tree.isStatic)
          return false;
        if (isConstructor(tree)) {
          constructor = tree;
          return false;
        }
        return true;
      });
      var staticElements = elements.filter(function(tree) {
        return tree.isStatic;
      }).map(removeStaticModifier);
      var protoObject = createObjectLiteral(protoElements);
      var staticObject = createObjectLiteral(staticElements);
      if (!constructor) {
        constructor = this.getDefaultConstructor_(tree);
      }
      var func = new FunctionExpression(tree.location, tree.name, null, constructor.parameterList, null, annotations, constructor.body);
      var expression;
      var createClass = this.getRuntimeExpression('createClass');
      if (tree.name) {
        var functionStatement;
        var name = tree.name.identifierToken;
        var nameId = id(("" + name));
        if (!this.options.transformOptions.blockBinding && this.options.parseOptions.blockBinding) {
          functionStatement = createVariableStatement(CONST, tree.name, func);
        } else {
          functionStatement = functionExpressionToDeclaration(func, name);
        }
        if (superClass) {
          expression = parseExpression($__getTemplateObject(["function($__super) {\n          ", ";\n          return (", ")(", ", ", ",\n                                  ", ", $__super);\n        }(", ")"]), functionStatement, createClass, nameId, protoObject, staticObject, superClass);
        } else {
          expression = parseExpression($__getTemplateObject(["function() {\n          ", ";\n          return (", ")(", ", ", ", ", ");\n        }()"]), functionStatement, createClass, nameId, protoObject, staticObject);
        }
      } else {
        if (superClass) {
          expression = parseExpression($__getTemplateObject(["(", ")(", ", ", ", ", ", ", ")"]), createClass, func, protoObject, staticObject, superClass);
        } else {
          expression = parseExpression($__getTemplateObject(["(", ")(", ", ", ", ", ")"]), createClass, func, protoObject, staticObject);
        }
      }
      return this.makeStrict_(expression);
    },
    transformExportDeclaration: function(tree) {
      if (tree.declaration.type === EXPORT_DEFAULT && tree.declaration.expression.type === CLASS_DECLARATION) {
        return this.transformExportDefaultClass_(tree.declaration);
      }
      return $__superGet(this, ClassTransformer.prototype, "transformExportDeclaration").call(this, tree);
    },
    transformExportDefaultClass_: function(tree) {
      var name = tree.expression.name.identifierToken;
      var specifier = new ExportSpecifier(name.location, name, createIdentifierToken('default'));
      var exportTree = new ExportSpecifierSet(name.location, [specifier]);
      var named = new NamedExport(name.location, exportTree, null);
      var exp = new ExportDeclaration(name.location, named, []);
      var classTree = this.transformAny(tree.expression);
      return new AnonBlock(null, [classTree, exp]);
    },
    getDefaultConstructor_: function(tree) {
      if (tree.superClass) {
        var name = id(tree.name.identifierToken);
        var superConstructor = this.getRuntimeExpression('superConstructor');
        return parsePropertyDefinition($__getTemplateObject(["constructor() {\n        ", "(", ").apply(this, arguments)\n      }"]), superConstructor, name);
      }
      return parsePropertyDefinition($__getTemplateObject(["constructor() {}"]));
    }
  }, {}, $__super);
}(ImportRuntimeTrait(ParenTrait(TempVarTransformer)));
