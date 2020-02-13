"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ObjectLiteralTransformer: {
    enumerable: true,
    get: function() {
      return ObjectLiteralTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var FindVisitor = require("./FindVisitor.js").FindVisitor;
var $__7 = require("../syntax/trees/ParseTrees.js"),
    FunctionExpression = $__7.FunctionExpression,
    IdentifierExpression = $__7.IdentifierExpression,
    LiteralExpression = $__7.LiteralExpression;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var IDENTIFIER = require("../syntax/TokenType.js").IDENTIFIER;
var $__10 = require("../syntax/trees/ParseTreeType.js"),
    COMPUTED_PROPERTY_NAME = $__10.COMPUTED_PROPERTY_NAME,
    LITERAL_PROPERTY_NAME = $__10.LITERAL_PROPERTY_NAME;
var StringMap = require("../util/StringMap.js").StringMap;
var $__12 = require("./ParseTreeFactory.js"),
    createAssignmentExpression = $__12.createAssignmentExpression,
    createCommaExpression = $__12.createCommaExpression,
    createDefineProperty = $__12.createDefineProperty,
    createEmptyParameterList = $__12.createEmptyParameterList,
    createFunctionExpression = $__12.createFunctionExpression,
    createIdentifierExpression = $__12.createIdentifierExpression,
    createObjectCreate = $__12.createObjectCreate,
    createObjectLiteral = $__12.createObjectLiteral,
    createParenExpression = $__12.createParenExpression,
    createPropertyNameAssignment = $__12.createPropertyNameAssignment,
    createStringLiteral = $__12.createStringLiteral;
var propName = require("../staticsemantics/PropName.js").propName;
var FindAdvancedProperty = function($__super) {
  function FindAdvancedProperty(transformOptions) {
    $__superConstructor(FindAdvancedProperty).call(this, true);
    this.transformOptions_ = transformOptions;
    this.protoExpression = null;
  }
  return ($__createClass)(FindAdvancedProperty, {
    visitPropertyNameAssignment: function(tree) {
      if (isProtoName(tree.name))
        this.protoExpression = tree.value;
      else
        this.visitAny(tree.name);
    },
    visitMethod: function(tree) {
      this.visitAny(tree.name);
    },
    visitGetAccessor: function(tree) {
      if (this.transformOptions_.properTailCalls) {
        this.found = true;
      } else {
        this.visitAny(tree.name);
      }
    },
    visitSetAccessor: function(tree) {
      if (this.transformOptions_.properTailCalls) {
        this.found = true;
      } else {
        this.visitAny(tree.name);
      }
    },
    visitComputedPropertyName: function(tree) {
      if (this.transformOptions_.computedPropertyNames)
        this.found = true;
    }
  }, {}, $__super);
}(FindVisitor);
function isProtoName(tree) {
  return propName(tree) === '__proto__';
}
var ObjectLiteralTransformer = function($__super) {
  function ObjectLiteralTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(ObjectLiteralTransformer).call(this, identifierGenerator, reporter, options);
    this.transformOptions_ = options.transformOptions;
    this.protoExpression = null;
    this.needsAdvancedTransform = false;
    this.seenAccessors = null;
  }
  return ($__createClass)(ObjectLiteralTransformer, {
    findSeenAccessor_: function(name) {
      if (name.type === COMPUTED_PROPERTY_NAME)
        return null;
      var s = propName(name);
      return this.seenAccessors.get(s);
    },
    removeSeenAccessor_: function(name) {
      if (name.type === COMPUTED_PROPERTY_NAME)
        return;
      var s = propName(name);
      this.seenAccessors.delete(s);
    },
    addSeenAccessor_: function(name, descr) {
      if (name.type === COMPUTED_PROPERTY_NAME)
        return;
      var s = propName(name);
      this.seenAccessors.set(s, descr);
    },
    createProperty_: function(name, descr) {
      var expression;
      if (name.type === LITERAL_PROPERTY_NAME) {
        if (this.needsAdvancedTransform)
          expression = this.getPropertyName_(name);
        else
          expression = name;
      } else {
        expression = name.expression;
      }
      if (descr.get || descr.set) {
        var oldAccessor = this.findSeenAccessor_(name);
        if (oldAccessor) {
          oldAccessor.get = descr.get || oldAccessor.get;
          oldAccessor.set = descr.set || oldAccessor.set;
          this.removeSeenAccessor_(name);
          return null;
        } else {
          this.addSeenAccessor_(name, descr);
        }
      }
      return [expression, descr];
    },
    getPropertyName_: function(nameTree) {
      var token = nameTree.literalToken;
      switch (token.type) {
        case IDENTIFIER:
          return createStringLiteral(token.value);
        default:
          if (token.isKeyword())
            return createStringLiteral(token.type);
          return new LiteralExpression(token.location, token);
      }
    },
    transformClassDeclaration: function(tree) {
      return tree;
    },
    transformClassExpression: function(tree) {
      return tree;
    },
    transformObjectLiteral: function(tree) {
      var oldNeedsTransform = this.needsAdvancedTransform;
      var oldSeenAccessors = this.seenAccessors;
      var transformed = this.transformObjectLiteralInner_(tree);
      this.needsAdvancedTransform = oldNeedsTransform;
      this.seenAccessors = oldSeenAccessors;
      return transformed;
    },
    transformObjectLiteralInner_: function(tree) {
      var finder = new FindAdvancedProperty(this.transformOptions_);
      finder.visitAny(tree);
      if (!finder.found) {
        this.needsAdvancedTransform = false;
        return $__superGet(this, ObjectLiteralTransformer.prototype, "transformObjectLiteral").call(this, tree);
      }
      this.needsAdvancedTransform = true;
      this.seenAccessors = new StringMap();
      var properties = this.transformList(tree.propertyNameAndValues);
      properties = properties.filter(function(tree) {
        return tree;
      });
      var tempVar = this.addTempVar();
      var tempVarIdentifierExpression = createIdentifierExpression(tempVar);
      var expressions = properties.map(function(property) {
        var expression = property[0];
        var descr = property[1];
        return createDefineProperty(tempVarIdentifierExpression, expression, descr);
      });
      var protoExpression = this.transformAny(finder.protoExpression);
      var objectExpression;
      if (protoExpression)
        objectExpression = createObjectCreate(protoExpression);
      else
        objectExpression = createObjectLiteral([]);
      expressions.unshift(createAssignmentExpression(tempVarIdentifierExpression, objectExpression));
      expressions.push(tempVarIdentifierExpression);
      return createParenExpression(createCommaExpression(expressions));
    },
    transformPropertyNameAssignment: function(tree) {
      if (!this.needsAdvancedTransform)
        return $__superGet(this, ObjectLiteralTransformer.prototype, "transformPropertyNameAssignment").call(this, tree);
      if (isProtoName(tree.name))
        return null;
      return this.createProperty_(tree.name, {
        value: this.transformAny(tree.value),
        configurable: true,
        enumerable: true,
        writable: true
      });
    },
    transformGetAccessor: function(tree) {
      if (!this.needsAdvancedTransform)
        return $__superGet(this, ObjectLiteralTransformer.prototype, "transformGetAccessor").call(this, tree);
      var body = this.transformAny(tree.body);
      var func = createFunctionExpression(createEmptyParameterList(), body);
      return this.createProperty_(tree.name, {
        get: func,
        configurable: true,
        enumerable: true
      });
    },
    transformSetAccessor: function(tree) {
      if (!this.needsAdvancedTransform)
        return $__superGet(this, ObjectLiteralTransformer.prototype, "transformSetAccessor").call(this, tree);
      var body = this.transformAny(tree.body);
      var parameterList = this.transformAny(tree.parameterList);
      var func = createFunctionExpression(parameterList, body);
      return this.createProperty_(tree.name, {
        set: func,
        configurable: true,
        enumerable: true
      });
    },
    transformMethod: function(tree) {
      var func = new FunctionExpression(tree.location, tree.debugName, tree.functionKind, this.transformAny(tree.parameterList), tree.typeAnnotation, [], this.transformAny(tree.body));
      if (!this.needsAdvancedTransform) {
        return createPropertyNameAssignment(tree.name, func);
      }
      var expression = this.transformAny(tree.name);
      return this.createProperty_(tree.name, {
        value: func,
        configurable: true,
        enumerable: true,
        writable: true
      });
    },
    transformPropertyNameShorthand: function(tree) {
      if (!this.needsAdvancedTransform)
        return $__superGet(this, ObjectLiteralTransformer.prototype, "transformPropertyNameShorthand").call(this, tree);
      var expression = this.transformAny(tree.name);
      return this.createProperty_(tree.name, {
        value: new IdentifierExpression(tree.location, tree.name.identifierToken),
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
  }, {}, $__super);
}(TempVarTransformer);
