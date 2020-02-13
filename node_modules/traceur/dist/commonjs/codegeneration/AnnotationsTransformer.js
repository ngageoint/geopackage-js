"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  AnnotationsTransformer: {
    enumerable: true,
    get: function() {
      return AnnotationsTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var CONSTRUCTOR = require("../syntax/PredefinedName.js").CONSTRUCTOR;
var STRING = require("../syntax/TokenType.js").STRING;
var $__13 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__13.AnonBlock,
    ClassDeclaration = $__13.ClassDeclaration,
    ExportDeclaration = $__13.ExportDeclaration,
    FormalParameter = $__13.FormalParameter,
    FunctionDeclaration = $__13.FunctionDeclaration,
    GetAccessor = $__13.GetAccessor,
    LiteralExpression = $__13.LiteralExpression,
    Method = $__13.Method,
    SetAccessor = $__13.SetAccessor;
var propName = require("../staticsemantics/PropName.js").propName;
var $__15 = require("./ParseTreeFactory.js"),
    createArgumentList = $__15.createArgumentList,
    createArrayLiteral = $__15.createArrayLiteral,
    createAssignmentStatement = $__15.createAssignmentStatement,
    createIdentifierExpression = $__15.createIdentifierExpression,
    createMemberExpression = $__15.createMemberExpression,
    createNewExpression = $__15.createNewExpression,
    createStringLiteralToken = $__15.createStringLiteralToken;
var $__16 = require("./PlaceholderParser.js"),
    parseExpression = $__16.parseExpression,
    parseStatement = $__16.parseStatement;
var AnnotationsScope = function() {
  function AnnotationsScope() {
    this.className = null;
    this.isExport = false;
    this.constructorParameters = [];
    this.annotations = [];
    this.metadata = [];
  }
  return ($__createClass)(AnnotationsScope, {get inClassScope() {
      return this.className !== null;
    }}, {});
}();
var AnnotationsTransformer = function($__super) {
  function AnnotationsTransformer() {
    $__superConstructor(AnnotationsTransformer).call(this);
    this.stack_ = [new AnnotationsScope()];
  }
  return ($__createClass)(AnnotationsTransformer, {
    transformExportDeclaration: function(tree) {
      var $__3;
      var scope = this.pushAnnotationScope_();
      scope.isExport = true;
      ($__3 = scope.annotations).push.apply($__3, $__spread(tree.annotations));
      var declaration = this.transformAny(tree.declaration);
      if (declaration !== tree.declaration || tree.annotations.length > 0)
        tree = new ExportDeclaration(tree.location, declaration, []);
      return this.appendMetadata_(tree);
    },
    transformClassDeclaration: function(tree) {
      var $__3,
          $__4;
      var elementsChanged = false;
      var exportAnnotations = this.scope.isExport ? this.scope.annotations : [];
      var scope = this.pushAnnotationScope_();
      scope.className = tree.name;
      ($__3 = scope.annotations).push.apply($__3, $__spread(exportAnnotations, tree.annotations));
      tree = $__superGet(this, AnnotationsTransformer.prototype, "transformClassDeclaration").call(this, tree);
      ($__4 = scope.metadata).unshift.apply($__4, $__spread(this.transformMetadata_(createIdentifierExpression(tree.name), scope.annotations, scope.constructorParameters)));
      if (tree.annotations.length > 0) {
        tree = new ClassDeclaration(tree.location, tree.name, tree.superClass, tree.elements, [], null);
      }
      return this.appendMetadata_(tree);
    },
    transformFunctionDeclaration: function(tree) {
      var $__3,
          $__4;
      var exportAnnotations = this.scope.isExport ? this.scope.annotations : [];
      var scope = this.pushAnnotationScope_();
      ($__3 = scope.annotations).push.apply($__3, $__spread(exportAnnotations, tree.annotations));
      ($__4 = scope.metadata).push.apply($__4, $__spread(this.transformMetadata_(createIdentifierExpression(tree.name), scope.annotations, tree.parameterList.parameters)));
      tree = $__superGet(this, AnnotationsTransformer.prototype, "transformFunctionDeclaration").call(this, tree);
      if (tree.annotations.length > 0) {
        tree = new FunctionDeclaration(tree.location, tree.name, tree.functionKind, tree.parameterList, tree.typeAnnotation, [], tree.body);
      }
      return this.appendMetadata_(tree);
    },
    transformFormalParameter: function(tree) {
      if (tree.annotations.length > 0) {
        tree = new FormalParameter(tree.location, tree.parameter, tree.typeAnnotation, []);
      }
      return $__superGet(this, AnnotationsTransformer.prototype, "transformFormalParameter").call(this, tree);
    },
    transformGetAccessor: function(tree) {
      var $__3;
      if (!this.scope.inClassScope)
        return $__superGet(this, AnnotationsTransformer.prototype, "transformGetAccessor").call(this, tree);
      ($__3 = this.scope.metadata).push.apply($__3, $__spread(this.transformMetadata_(this.transformAccessor_(tree, this.scope.className, 'get'), tree.annotations, [])));
      if (tree.annotations.length > 0) {
        tree = new GetAccessor(tree.location, tree.isStatic, tree.name, tree.typeAnnotation, [], tree.body);
      }
      return $__superGet(this, AnnotationsTransformer.prototype, "transformGetAccessor").call(this, tree);
    },
    transformSetAccessor: function(tree) {
      var $__3;
      if (!this.scope.inClassScope)
        return $__superGet(this, AnnotationsTransformer.prototype, "transformSetAccessor").call(this, tree);
      ($__3 = this.scope.metadata).push.apply($__3, $__spread(this.transformMetadata_(this.transformAccessor_(tree, this.scope.className, 'set'), tree.annotations, tree.parameterList.parameters)));
      var parameterList = this.transformAny(tree.parameterList);
      if (parameterList !== tree.parameterList || tree.annotations.length > 0) {
        tree = new SetAccessor(tree.location, tree.isStatic, tree.name, parameterList, [], tree.body);
      }
      return $__superGet(this, AnnotationsTransformer.prototype, "transformSetAccessor").call(this, tree);
    },
    transformMethod: function(tree) {
      var $__3,
          $__4;
      if (!this.scope.inClassScope)
        return $__superGet(this, AnnotationsTransformer.prototype, "transformMethod").call(this, tree);
      if (!tree.isStatic && propName(tree) === CONSTRUCTOR) {
        ($__3 = this.scope.annotations).push.apply($__3, $__spread(tree.annotations));
        this.scope.constructorParameters = tree.parameterList.parameters;
      } else {
        ($__4 = this.scope.metadata).push.apply($__4, $__spread(this.transformMetadata_(this.transformPropertyMethod_(tree, this.scope.className), tree.annotations, tree.parameterList.parameters)));
      }
      var parameterList = this.transformAny(tree.parameterList);
      if (parameterList !== tree.parameterList || tree.annotations.length > 0) {
        tree = new Method(tree.location, tree.isStatic, tree.functionKind, tree.name, parameterList, tree.typeAnnotation, [], tree.body, tree.debugName);
      }
      return $__superGet(this, AnnotationsTransformer.prototype, "transformMethod").call(this, tree);
    },
    appendMetadata_: function(tree) {
      var $__3;
      var metadata = this.stack_.pop().metadata;
      if (metadata.length > 0) {
        if (this.scope.isExport) {
          ($__3 = this.scope.metadata).push.apply($__3, $__spread(metadata));
        } else {
          tree = new AnonBlock(null, $__spread([tree], metadata));
        }
      }
      return tree;
    },
    transformClassReference_: function(tree, className) {
      var parent = createIdentifierExpression(className);
      if (!tree.isStatic)
        parent = createMemberExpression(parent, 'prototype');
      return parent;
    },
    transformPropertyMethod_: function(tree, className) {
      return createMemberExpression(this.transformClassReference_(tree, className), tree.name.literalToken);
    },
    transformAccessor_: function(tree, className, accessor) {
      var args = createArgumentList([this.transformClassReference_(tree, className), this.createLiteralStringExpression_(tree.name)]);
      var descriptor = parseExpression($__getTemplateObject(["Object.getOwnPropertyDescriptor(", ")"]), args);
      return createMemberExpression(descriptor, accessor);
    },
    transformParameters_: function(parameters) {
      var $__2 = this;
      var hasParameterMetadata = false;
      parameters = parameters.map(function(param) {
        var $__3;
        var metadata = [];
        if (param.typeAnnotation)
          metadata.push($__2.transformAny(param.typeAnnotation));
        if (param.annotations && param.annotations.length > 0)
          ($__3 = metadata).push.apply($__3, $__spread($__2.transformAnnotations_(param.annotations)));
        if (metadata.length > 0) {
          hasParameterMetadata = true;
          return createArrayLiteral(metadata);
        }
        return createArrayLiteral([]);
      });
      return hasParameterMetadata ? parameters : [];
    },
    transformAnnotations_: function(annotations) {
      return annotations.map(function(annotation) {
        return createNewExpression(annotation.name, annotation.args);
      });
    },
    transformMetadata_: function(target, annotations, parameters) {
      var metadataStatements = [];
      if (annotations !== null) {
        annotations = this.transformAnnotations_(annotations);
        if (annotations.length > 0) {
          metadataStatements.push(this.createDefinePropertyStatement_(target, 'annotations', createArrayLiteral(annotations)));
        }
      }
      if (parameters !== null) {
        parameters = this.transformParameters_(parameters);
        if (parameters.length > 0) {
          metadataStatements.push(this.createDefinePropertyStatement_(target, 'parameters', createArrayLiteral(parameters)));
        }
      }
      return metadataStatements;
    },
    createDefinePropertyStatement_: function(target, property, value) {
      return parseStatement($__getTemplateObject(["Object.defineProperty(", ", ", ",\n        {get: function() {return ", "}});"]), target, property, value);
    },
    createLiteralStringExpression_: function(tree) {
      var token = tree.literalToken;
      if (tree.literalToken.type !== STRING)
        token = createStringLiteralToken(tree.literalToken.value);
      return new LiteralExpression(null, token);
    },
    get scope() {
      return this.stack_[this.stack_.length - 1];
    },
    pushAnnotationScope_: function() {
      var scope = new AnnotationsScope();
      this.stack_.push(scope);
      return scope;
    }
  }, {}, $__super);
}(ParseTreeTransformer);
