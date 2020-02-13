"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return $__default;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__4 = require("../syntax/trees/ParseTrees.js"),
    AnonBlock = $__4.AnonBlock,
    Catch = $__4.Catch,
    FunctionBody = $__4.FunctionBody,
    ForInStatement = $__4.ForInStatement,
    ForOfStatement = $__4.ForOfStatement,
    ForStatement = $__4.ForStatement,
    VariableDeclarationList = $__4.VariableDeclarationList,
    VariableStatement = $__4.VariableStatement;
var $__5 = require("../syntax/trees/ParseTreeType.js"),
    OBJECT_PATTERN = $__5.OBJECT_PATTERN,
    VARIABLE_DECLARATION_LIST = $__5.VARIABLE_DECLARATION_LIST;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var StringSet = require("../util/StringSet.js").StringSet;
var VAR = require("../syntax/TokenType.js").VAR;
var $__9 = require("./ParseTreeFactory.js"),
    createAssignmentExpression = $__9.createAssignmentExpression,
    createCommaExpression = $__9.createCommaExpression,
    createExpressionStatement = $__9.createExpressionStatement,
    id = $__9.createIdentifierExpression,
    createParenExpression = $__9.createParenExpression,
    createVariableDeclaration = $__9.createVariableDeclaration;
var prependStatements = require("./PrependStatements.js").prependStatements;
var HoistVariablesTransformer = function($__super) {
  function HoistVariablesTransformer() {
    var shouldHoistFunctions = arguments[0] !== (void 0) ? arguments[0] : false;
    $__superConstructor(HoistVariablesTransformer).call(this);
    this.hoistedFunctions_ = [];
    this.hoistedVariables_ = new StringSet();
    this.keepBindingIdentifiers_ = false;
    this.inBlockOrFor_ = false;
    this.shouldHoistFunctions_ = shouldHoistFunctions;
  }
  return ($__createClass)(HoistVariablesTransformer, {
    transformFunctionBody: function(tree) {
      var statements = this.transformList(tree.statements);
      if (statements === tree.statements)
        return tree;
      statements = this.prependVariables(statements);
      statements = this.prependFunctions(statements);
      return new FunctionBody(tree.location, statements);
    },
    addVariable: function(name) {
      this.hoistedVariables_.add(name);
    },
    addFunctionDeclaration: function(tree) {
      this.hoistedFunctions_.push(tree);
    },
    hasVariables: function() {
      return !this.hoistedVariables_.isEmpty();
    },
    hasFunctions: function() {
      return this.hoistedFunctions_.length > 0;
    },
    getVariableNames: function() {
      return this.hoistedVariables_.valuesAsArray();
    },
    getVariableStatement: function() {
      if (!this.hasVariables())
        return new AnonBlock(null, []);
      var declarations = this.getVariableNames().map(function(name) {
        return createVariableDeclaration(name, null);
      });
      return new VariableStatement(null, new VariableDeclarationList(null, VAR, declarations));
    },
    getFunctions: function() {
      return this.hoistedFunctions_;
    },
    prependVariables: function(statements) {
      if (!this.hasVariables())
        return statements;
      return prependStatements(statements, this.getVariableStatement());
    },
    prependFunctions: function(statements) {
      if (!this.hasFunctions())
        return statements;
      return prependStatements(statements, this.getFunctionDeclarations());
    },
    transformVariableStatement: function(tree) {
      var declarations = this.transformAny(tree.declarations);
      if (declarations === tree.declarations)
        return tree;
      if (declarations === null)
        return new AnonBlock(null, []);
      if (declarations.type === VARIABLE_DECLARATION_LIST)
        return new VariableStatement(tree.location, declarations);
      return createExpressionStatement(declarations);
    },
    transformVariableDeclaration: function(tree) {
      var lvalue = this.transformAny(tree.lvalue);
      var initializer = this.transformAny(tree.initializer);
      if (initializer) {
        var expression = createAssignmentExpression(lvalue, initializer);
        if (lvalue.type === OBJECT_PATTERN)
          expression = createParenExpression(expression);
        return expression;
      }
      return null;
    },
    transformObjectPattern: function(tree) {
      var keepBindingIdentifiers = this.keepBindingIdentifiers_;
      this.keepBindingIdentifiers_ = true;
      var transformed = $__superGet(this, HoistVariablesTransformer.prototype, "transformObjectPattern").call(this, tree);
      this.keepBindingIdentifiers_ = keepBindingIdentifiers;
      return transformed;
    },
    transformArrayPattern: function(tree) {
      var keepBindingIdentifiers = this.keepBindingIdentifiers_;
      this.keepBindingIdentifiers_ = true;
      var transformed = $__superGet(this, HoistVariablesTransformer.prototype, "transformArrayPattern").call(this, tree);
      this.keepBindingIdentifiers_ = keepBindingIdentifiers;
      return transformed;
    },
    transformBindingIdentifier: function(tree) {
      var idToken = tree.identifierToken;
      this.addVariable(idToken.value);
      if (this.keepBindingIdentifiers_)
        return tree;
      return id(idToken);
    },
    transformVariableDeclarationList: function(tree) {
      if (tree.declarationType === VAR || !this.inBlockOrFor_) {
        var expressions = this.transformList(tree.declarations);
        expressions = expressions.filter(function(tree) {
          return tree;
        });
        if (expressions.length === 0)
          return null;
        if (expressions.length === 1)
          return expressions[0];
        return createCommaExpression(expressions);
      }
      return tree;
    },
    transformCatch: function(tree) {
      var catchBody = this.transformAny(tree.catchBody);
      if (catchBody === tree.catchBody)
        return tree;
      return new Catch(tree.location, tree.binding, catchBody);
    },
    transformForInStatement: function(tree) {
      return this.transformLoop_(tree, ForInStatement);
    },
    transformForOfStatement: function(tree) {
      return this.transformLoop_(tree, ForOfStatement);
    },
    transformForOnStatement: function(tree) {
      return this.transformLoop_(tree, ForOfStatement);
    },
    transformLoop_: function(tree, ctor) {
      var initializer = this.transformLoopIninitaliser_(tree.initializer);
      var collection = this.transformAny(tree.collection);
      var body = this.transformAny(tree.body);
      if (initializer === tree.initializer && collection === tree.collection && body === tree.body) {
        return tree;
      }
      return new ctor(tree.location, initializer, collection, body);
    },
    transformLoopIninitaliser_: function(tree) {
      if (tree.type !== VARIABLE_DECLARATION_LIST || tree.declarationType !== VAR)
        return tree;
      return this.transformAny(tree.declarations[0].lvalue);
    },
    transformForStatement: function(tree) {
      var inBlockOrFor = this.inBlockOrFor_;
      this.inBlockOrFor_ = true;
      var initializer = this.transformAny(tree.initializer);
      this.inBlockOrFor_ = inBlockOrFor;
      var condition = this.transformAny(tree.condition);
      var increment = this.transformAny(tree.increment);
      var body = this.transformAny(tree.body);
      if (initializer === tree.initializer && condition === tree.condition && increment === tree.increment && body === tree.body) {
        return tree;
      }
      return new ForStatement(tree.location, initializer, condition, increment, body);
    },
    transformBlock: function(tree) {
      var inBlockOrFor = this.inBlockOrFor_;
      this.inBlockOrFor_ = true;
      tree = $__superGet(this, HoistVariablesTransformer.prototype, "transformBlock").call(this, tree);
      this.inBlockOrFor_ = inBlockOrFor;
      return tree;
    },
    addMachineVariable: function(name) {
      this.machineVariables_[name] = true;
    },
    transformClassDeclaration: function(tree) {
      return tree;
    },
    transformClassExpression: function(tree) {
      return tree;
    },
    transformFunctionDeclaration: function(tree) {
      if (this.shouldHoistFunctions_) {
        this.addFunctionDeclaration(tree);
        return new AnonBlock(null, []);
      }
      return tree;
    },
    transformFunctionExpression: function(tree) {
      return tree;
    },
    transformGetAccessor: function(tree) {
      return tree;
    },
    transformSetAccessor: function(tree) {
      return tree;
    },
    transformMethod: function(tree) {
      return tree;
    },
    transformArrowFunction: function(tree) {
      return tree;
    },
    transformComprehensionFor: function(tree) {
      return tree;
    }
  }, {}, $__super);
}(ParseTreeTransformer);
var $__default = HoistVariablesTransformer;
