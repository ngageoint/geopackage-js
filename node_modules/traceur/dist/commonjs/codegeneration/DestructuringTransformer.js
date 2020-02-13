"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  DestructuringTransformer: {
    enumerable: true,
    get: function() {
      return DestructuringTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var $__13 = require("../syntax/trees/ParseTreeType.js"),
    ARRAY_LITERAL = $__13.ARRAY_LITERAL,
    ARRAY_PATTERN = $__13.ARRAY_PATTERN,
    ASSIGNMENT_ELEMENT = $__13.ASSIGNMENT_ELEMENT,
    BINDING_ELEMENT = $__13.BINDING_ELEMENT,
    BINDING_IDENTIFIER = $__13.BINDING_IDENTIFIER,
    BLOCK = $__13.BLOCK,
    CALL_EXPRESSION = $__13.CALL_EXPRESSION,
    COMPUTED_PROPERTY_NAME = $__13.COMPUTED_PROPERTY_NAME,
    IDENTIFIER_EXPRESSION = $__13.IDENTIFIER_EXPRESSION,
    LITERAL_EXPRESSION = $__13.LITERAL_EXPRESSION,
    MEMBER_EXPRESSION = $__13.MEMBER_EXPRESSION,
    MEMBER_LOOKUP_EXPRESSION = $__13.MEMBER_LOOKUP_EXPRESSION,
    OBJECT_LITERAL = $__13.OBJECT_LITERAL,
    OBJECT_PATTERN_FIELD = $__13.OBJECT_PATTERN_FIELD,
    OBJECT_PATTERN = $__13.OBJECT_PATTERN,
    PAREN_EXPRESSION = $__13.PAREN_EXPRESSION,
    VARIABLE_DECLARATION_LIST = $__13.VARIABLE_DECLARATION_LIST,
    VARIABLE_STATEMENT = $__13.VARIABLE_STATEMENT;
var $__14 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__14.AnonBlock,
    AssignmentElement = $__14.AssignmentElement,
    BindingElement = $__14.BindingElement,
    Catch = $__14.Catch,
    ExportDeclaration = $__14.ExportDeclaration,
    ForInStatement = $__14.ForInStatement,
    ForOfStatement = $__14.ForOfStatement,
    ForOnStatement = $__14.ForOnStatement,
    VariableDeclarationList = $__14.VariableDeclarationList,
    VariableStatement = $__14.VariableStatement;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__17 = require("../syntax/TokenType.js"),
    EQUAL = $__17.EQUAL,
    LET = $__17.LET,
    VAR = $__17.VAR;
var bindingsInDestructuringPattern = $__interopRequire("../semantics/bindingsInDestructuringPattern.js").default;
var $__19 = require("./ParseTreeFactory.js"),
    createAssignmentExpression = $__19.createAssignmentExpression,
    createBindingIdentifier = $__19.createBindingIdentifier,
    createBlock = $__19.createBlock,
    createCommaExpression = $__19.createCommaExpression,
    createExpressionStatement = $__19.createExpressionStatement,
    createFunctionBody = $__19.createFunctionBody,
    createIdentifierExpression = $__19.createIdentifierExpression,
    createMemberExpression = $__19.createMemberExpression,
    createMemberLookupExpression = $__19.createMemberLookupExpression,
    createParenExpression = $__19.createParenExpression,
    createVariableDeclaration = $__19.createVariableDeclaration,
    createVariableDeclarationList = $__19.createVariableDeclarationList,
    createVariableStatement = $__19.createVariableStatement;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var prependStatements = require("./PrependStatements.js").prependStatements;
var Desugaring = function() {
  function Desugaring(rvalue) {
    this.rvalue = rvalue;
    this.expressions = [];
    this.pendingExpressions = [];
  }
  return ($__createClass)(Desugaring, {
    createIterator: function(iterId) {
      this.pendingExpressions.push(parseExpression($__getTemplateObject(["", " = ", "[Symbol.iterator]()"]), iterId, this.rvalue));
    },
    createInitializer: function(expression) {
      if (this.pendingExpressions.length === 0)
        return expression;
      var expressions = this.pendingExpressions;
      this.pendingExpressions = [];
      expressions.push(expression);
      return createParenExpression(createCommaExpression(expressions));
    },
    skipHole: function(iterId) {
      this.pendingExpressions.push(parseExpression($__getTemplateObject(["", ".next()"]), iterId));
    }
  }, {});
}();
var AssignmentExpressionDesugaring = function($__super) {
  function AssignmentExpressionDesugaring(rvalue) {
    $__superConstructor(AssignmentExpressionDesugaring).call(this, rvalue);
  }
  return ($__createClass)(AssignmentExpressionDesugaring, {
    assign: function(lvalue, rvalue) {
      lvalue = lvalue instanceof AssignmentElement ? lvalue.assignment : lvalue;
      rvalue = this.createInitializer(rvalue);
      this.expressions.push(createAssignmentExpression(lvalue, rvalue));
    },
    createAssignmentExpression: function(tempId, rvalue) {
      var $__6;
      var expressions = this.expressions;
      expressions.unshift(createAssignmentExpression(tempId, rvalue));
      ($__6 = expressions).push.apply($__6, $__spread(this.pendingExpressions, [tempId]));
      return createParenExpression(createCommaExpression(expressions));
    }
  }, {}, $__super);
}(Desugaring);
var VariableDeclarationDesugaring = function($__super) {
  function VariableDeclarationDesugaring(rvalue) {
    $__superConstructor(VariableDeclarationDesugaring).call(this, rvalue);
  }
  return ($__createClass)(VariableDeclarationDesugaring, {
    assign: function(lvalue, rvalue) {
      var binding = lvalue instanceof BindingElement ? lvalue.binding : createBindingIdentifier(lvalue);
      rvalue = this.createInitializer(rvalue);
      this.expressions.push(createVariableDeclaration(binding, rvalue));
    },
    get declarations() {
      return this.expressions;
    }
  }, {}, $__super);
}(Desugaring);
var DestructuringTransformer = function($__super) {
  function DestructuringTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(DestructuringTransformer).call(this, identifierGenerator, reporter, options);
    this.parameterDeclarations = null;
  }
  return ($__createClass)(DestructuringTransformer, {
    transformArrayPattern: function(tree) {
      throw new Error('unreachable');
    },
    transformObjectPattern: function(tree) {
      throw new Error('unreachable');
    },
    transformBinaryExpression: function(tree) {
      this.pushTempScope();
      var rv;
      if (tree.operator.type === EQUAL && tree.left.isPattern()) {
        rv = this.transformAny(this.desugarAssignment_(tree.left, tree.right));
      } else {
        rv = $__superGet(this, DestructuringTransformer.prototype, "transformBinaryExpression").call(this, tree);
      }
      this.popTempScope();
      return rv;
    },
    desugarAssignment_: function(lvalue, rvalue) {
      var tempId = createIdentifierExpression(this.addTempVar());
      var desugaring = new AssignmentExpressionDesugaring(tempId);
      this.desugarPattern_(desugaring, lvalue);
      return desugaring.createAssignmentExpression(tempId, rvalue);
    },
    transformVariableDeclarationList: function(tree) {
      var $__4 = this;
      if (!hasDestructuring(tree)) {
        return $__superGet(this, DestructuringTransformer.prototype, "transformVariableDeclarationList").call(this, tree);
      }
      var desugaredDeclarations = [];
      tree.declarations.forEach(function(declaration) {
        var $__6;
        if (declaration.lvalue.isPattern()) {
          ($__6 = desugaredDeclarations).push.apply($__6, $__spread($__4.desugarVariableDeclaration_(declaration)));
        } else {
          desugaredDeclarations.push(declaration);
        }
      });
      var transformedTree = this.transformVariableDeclarationList(createVariableDeclarationList(tree.declarationType, desugaredDeclarations));
      return transformedTree;
    },
    transformForInStatement: function(tree) {
      return this.transformForInOrOfOrOn_(tree, $__superGet(this, DestructuringTransformer.prototype, "transformForInStatement"), ForInStatement);
    },
    transformForOfStatement: function(tree) {
      return this.transformForInOrOfOrOn_(tree, $__superGet(this, DestructuringTransformer.prototype, "transformForOfStatement"), ForOfStatement);
    },
    transformForOnStatement: function(tree) {
      return this.transformForInOrOfOrOn_(tree, $__superGet(this, DestructuringTransformer.prototype, "transformForOnStatement"), ForOnStatement);
    },
    transformForInOrOfOrOn_: function(tree, superMethod, constr) {
      var $__6;
      if (!tree.initializer.isPattern() && (tree.initializer.type !== VARIABLE_DECLARATION_LIST || !hasDestructuring(tree.initializer))) {
        return superMethod.call(this, tree);
      }
      this.pushTempScope();
      var declarationType,
          lvalue;
      if (tree.initializer.isPattern()) {
        declarationType = null;
        lvalue = tree.initializer;
      } else {
        declarationType = tree.initializer.declarationType;
        lvalue = tree.initializer.declarations[0].lvalue;
      }
      var statements = [];
      var binding = this.desugarBinding_(lvalue, statements, declarationType);
      var initializer = createVariableDeclarationList(VAR, binding, null);
      var collection = this.transformAny(tree.collection);
      var body = this.transformAny(tree.body);
      if (body.type === BLOCK)
        ($__6 = statements).push.apply($__6, $__spread(body.statements));
      else
        statements.push(body);
      body = createBlock(statements);
      this.popTempScope();
      return new constr(tree.location, initializer, collection, body);
    },
    transformAssignmentElement: function(tree) {
      throw new Error('unreachable');
    },
    transformBindingElement: function(tree) {
      if (!tree.binding.isPattern() || tree.initializer)
        return tree;
      if (this.parameterDeclarations === null) {
        this.parameterDeclarations = [];
        this.pushTempScope();
      }
      var varName = this.getTempIdentifier();
      var binding = createBindingIdentifier(varName);
      var initializer = createIdentifierExpression(varName);
      var decl = createVariableDeclaration(tree.binding, initializer);
      this.parameterDeclarations.push(decl);
      return new BindingElement(null, binding, null);
    },
    transformFunctionBody: function(tree) {
      if (this.parameterDeclarations === null)
        return $__superGet(this, DestructuringTransformer.prototype, "transformFunctionBody").call(this, tree);
      var list = createVariableDeclarationList(VAR, this.parameterDeclarations);
      var statement = createVariableStatement(list);
      var statements = prependStatements(tree.statements, statement);
      var newBody = createFunctionBody(statements);
      this.parameterDeclarations = null;
      var result = $__superGet(this, DestructuringTransformer.prototype, "transformFunctionBody").call(this, newBody);
      this.popTempScope();
      return result;
    },
    transformCatch: function(tree) {
      var $__6;
      if (!tree.binding.isPattern())
        return $__superGet(this, DestructuringTransformer.prototype, "transformCatch").call(this, tree);
      var body = this.transformAny(tree.catchBody);
      var statements = [];
      var kind = this.options.blockBinding ? LET : VAR;
      var binding = this.desugarBinding_(tree.binding, statements, kind);
      ($__6 = statements).push.apply($__6, $__spread(body.statements));
      return new Catch(tree.location, binding, createBlock(statements));
    },
    transformExportDeclaration: function(tree) {
      if (tree.declaration.type === VARIABLE_STATEMENT && hasDestructuring(tree.declaration.declarations)) {
        var names = bindingsInDestructuringPattern(tree.declaration.declarations);
        var declaration = this.transformAny(tree.declaration);
        var statements = [];
        var $__5 = declaration.declarations,
            declarations = $__5.declarations,
            declarationType = $__5.declarationType;
        for (var i = 0; i < declarations.length; i++) {
          var declaration$__7 = declarations[i];
          var statement = new VariableStatement(declaration$__7.location, new VariableDeclarationList(declaration$__7.location, declarationType, [declaration$__7]));
          if (names.has(declarations[i].lvalue.getStringValue())) {
            statement = new ExportDeclaration(statement.location, statement, []);
          }
          statements.push(statement);
        }
        return new AnonBlock(null, statements);
      }
      return $__superGet(this, DestructuringTransformer.prototype, "transformExportDeclaration").call(this, tree);
    },
    desugarBinding_: function(bindingTree, statements, declarationType) {
      var varName = this.getTempIdentifier();
      var binding = createBindingIdentifier(varName);
      var idExpr = createIdentifierExpression(varName);
      var desugaring;
      if (declarationType === null)
        desugaring = new AssignmentExpressionDesugaring(idExpr);
      else
        desugaring = new VariableDeclarationDesugaring(idExpr);
      this.desugarPattern_(desugaring, bindingTree);
      if (declarationType === null) {
        statements.push(createExpressionStatement(createCommaExpression(desugaring.expressions)));
      } else {
        statements.push(createVariableStatement(this.transformVariableDeclarationList(createVariableDeclarationList(declarationType, desugaring.declarations))));
      }
      return binding;
    },
    desugarVariableDeclaration_: function(tree) {
      var tempRValueName = this.getTempIdentifier();
      var tempRValueIdent = createIdentifierExpression(tempRValueName);
      var desugaring;
      var initializer;
      switch (tree.initializer.type) {
        case ARRAY_LITERAL:
        case CALL_EXPRESSION:
        case IDENTIFIER_EXPRESSION:
        case LITERAL_EXPRESSION:
        case MEMBER_EXPRESSION:
        case MEMBER_LOOKUP_EXPRESSION:
        case OBJECT_LITERAL:
        case PAREN_EXPRESSION:
          initializer = tree.initializer;
      }
      desugaring = new VariableDeclarationDesugaring(tempRValueIdent);
      desugaring.assign(desugaring.rvalue, tree.initializer);
      var initializerFound = this.desugarPattern_(desugaring, tree.lvalue);
      if (initializerFound || desugaring.declarations.length > 2) {
        return desugaring.declarations;
      }
      if (!initializer) {
        initializer = createParenExpression(tree.initializer);
      }
      desugaring = new VariableDeclarationDesugaring(initializer);
      this.desugarPattern_(desugaring, tree.lvalue);
      return desugaring.declarations;
    },
    desugarPattern_: function(desugaring, tree) {
      var $__4 = this;
      var initializerFound = false;
      var pattern;
      switch (tree.type) {
        case ARRAY_PATTERN:
          {
            pattern = tree;
            this.pushTempScope();
            var iterId = createIdentifierExpression(this.addTempVar());
            var iterObjectId = createIdentifierExpression(this.addTempVar());
            desugaring.createIterator(iterId);
            for (var i = 0; i < pattern.elements.length; i++) {
              var lvalue = pattern.elements[i];
              if (lvalue === null) {
                desugaring.skipHole(iterId);
                continue;
              } else if (lvalue.isSpreadPatternElement()) {
                var iteratorToArray = this.getRuntimeExpression('iteratorToArray');
                desugaring.assign(lvalue.lvalue, parseExpression($__getTemplateObject(["", "(", ")"]), iteratorToArray, iterId));
              } else {
                if (lvalue.initializer) {
                  initializerFound = true;
                }
                desugaring.assign(lvalue, this.createConditionalIterExpression(iterObjectId, iterId, lvalue.initializer));
              }
            }
            this.popTempScope();
            break;
          }
        case OBJECT_PATTERN:
          {
            pattern = tree;
            var elementHelper = function(lvalue, initializer) {
              if (initializer)
                initializerFound = true;
              var lookup = $__4.createConditionalMemberExpression(desugaring.rvalue, lvalue, initializer);
              desugaring.assign(lvalue, lookup);
            };
            pattern.fields.forEach(function(field) {
              var lookup;
              switch (field.type) {
                case ASSIGNMENT_ELEMENT:
                  elementHelper(field.assignment, field.initializer);
                  break;
                case BINDING_ELEMENT:
                  elementHelper(field.binding, field.initializer);
                  break;
                case OBJECT_PATTERN_FIELD:
                  {
                    if (field.element.initializer)
                      initializerFound = true;
                    var name = field.name;
                    lookup = $__4.createConditionalMemberExpression(desugaring.rvalue, name, field.element.initializer);
                    desugaring.assign(field.element, lookup);
                    break;
                  }
                default:
                  throw Error('unreachable');
              }
            });
            break;
          }
        case PAREN_EXPRESSION:
          return this.desugarPattern_(desugaring, tree.expression);
        default:
          throw new Error('unreachable');
      }
      if (desugaring instanceof VariableDeclarationDesugaring && desugaring.declarations.length === 0) {
        desugaring.assign(createBindingIdentifier(this.getTempIdentifier()), desugaring.rvalue);
      }
      return initializerFound;
    },
    createConditionalMemberExpression: function(rvalue, name, initializer) {
      if (name.type === COMPUTED_PROPERTY_NAME) {
        return this.createConditionalMemberLookupExpression(rvalue, name.expression, initializer);
      }
      var token;
      switch (name.type) {
        case BINDING_IDENTIFIER:
        case IDENTIFIER_EXPRESSION:
          token = name.identifierToken;
          break;
        default:
          token = name.literalToken;
      }
      if (!initializer)
        return createMemberExpression(rvalue, token);
      var tempIdent = createIdentifierExpression(this.addTempVar());
      return parseExpression($__getTemplateObject(["(", " = ", ".", ") === void 0 ?\n        ", " : ", ""]), tempIdent, rvalue, token, initializer, tempIdent);
    },
    createConditionalMemberLookupExpression: function(rvalue, index, initializer) {
      if (!initializer)
        return createMemberLookupExpression(rvalue, index);
      var tempIdent = createIdentifierExpression(this.addTempVar());
      return parseExpression($__getTemplateObject(["(", " = ", "[", "]) === void 0 ?\n        ", " : ", ""]), tempIdent, rvalue, index, initializer, tempIdent);
    },
    createConditionalIterExpression: function(iterObjectId, iterId, initializer) {
      var expr = parseExpression($__getTemplateObject(["(", " =\n        ", ".next()).done ? void 0 : ", ".value"]), iterObjectId, iterId, iterObjectId);
      if (!initializer) {
        return expr;
      }
      var tempIdent = createIdentifierExpression(this.addTempVar());
      return parseExpression($__getTemplateObject(["(", " = ", ") === void 0 ?\n        ", " : ", ""]), tempIdent, expr, initializer, tempIdent);
    }
  }, {}, $__super);
}(ImportRuntimeTrait(TempVarTransformer));
function hasDestructuring(tree) {
  return tree.declarations.some(function(declaration) {
    return declaration.lvalue.isPattern();
  });
}
