"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  SuperTransformer: {
    enumerable: true,
    get: function() {
      return SuperTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var ImportRuntimeTrait = $__interopRequire("./ImportRuntimeTrait.js").default;
var TempVarTransformer = require("./TempVarTransformer.js").TempVarTransformer;
var $__12 = require("../syntax/trees/ParseTrees.js"),
    ArgumentList = $__12.ArgumentList,
    ClassDeclaration = $__12.ClassDeclaration,
    ClassExpression = $__12.ClassExpression,
    GetAccessor = $__12.GetAccessor,
    MemberExpression = $__12.MemberExpression,
    Method = $__12.Method,
    SetAccessor = $__12.SetAccessor;
var $__13 = require("../syntax/trees/ParseTreeType.js"),
    MEMBER_EXPRESSION = $__13.MEMBER_EXPRESSION,
    MEMBER_LOOKUP_EXPRESSION = $__13.MEMBER_LOOKUP_EXPRESSION,
    SUPER_EXPRESSION = $__13.SUPER_EXPRESSION;
var $__14 = require("../syntax/TokenType.js"),
    EQUAL = $__14.EQUAL,
    MINUS_MINUS = $__14.MINUS_MINUS,
    PLUS_PLUS = $__14.PLUS_PLUS;
var $__15 = require("./ParseTreeFactory.js"),
    createAssignmentExpression = $__15.createAssignmentExpression,
    createBindingIdentifier = $__15.createBindingIdentifier,
    createIdentifierExpression = $__15.createIdentifierExpression,
    createIdentifierToken = $__15.createIdentifierToken,
    createParenExpression = $__15.createParenExpression,
    createStringLiteral = $__15.createStringLiteral,
    createThisExpression = $__15.createThisExpression;
var parseExpression = require("./PlaceholderParser.js").parseExpression;
var ExplodeExpressionTransformer = require("./ExplodeExpressionTransformer.js").ExplodeExpressionTransformer;
function hasSuperMemberExpression(tree) {
  return (tree.type === MEMBER_EXPRESSION || tree.type === MEMBER_LOOKUP_EXPRESSION) && tree.operand.type === SUPER_EXPRESSION;
}
var State = function() {
  function State(transformer, home) {
    this.transformer = transformer;
    this.home_ = home;
    this.tempName = home ? null : transformer.getTempIdentifier();
    this.hasSuper = false;
  }
  return ($__createClass)(State, {get home() {
      this.hasSuper = true;
      if (this.home_ === null) {
        this.home_ = createIdentifierExpression(createIdentifierToken(this.tempName));
      }
      return this.home_;
    }}, {});
}();
var ClassState = function($__super) {
  function ClassState(transformer, tree) {
    var home = null;
    if (tree.name !== null) {
      home = createIdentifierExpression(tree.name.identifierToken);
    }
    $__superConstructor(ClassState).call(this, transformer, home);
    this.name_ = tree.name;
  }
  return ($__createClass)(ClassState, {get name() {
      if (this.name_ !== null)
        return this.name_;
      if (this.hasSuper) {
        return createBindingIdentifier(this.home.identifierToken);
      }
      return null;
    }}, {}, $__super);
}(State);
var PrototypeState = function($__super) {
  function PrototypeState(transformer, classState) {
    $__superConstructor(PrototypeState).call(this, transformer, null);
    this.classState = classState;
  }
  return ($__createClass)(PrototypeState, {get home() {
      var ident = this.classState.home;
      return new MemberExpression(null, ident, createIdentifierToken('prototype'));
    }}, {}, $__super);
}(State);
var SuperTransformer = function($__super) {
  function SuperTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(SuperTransformer).call(this, identifierGenerator, reporter, options);
    this.stateStack_ = [];
  }
  return ($__createClass)(SuperTransformer, {
    pushState: function(state) {
      this.stateStack_.push(state);
    },
    popState: function() {
      return this.stateStack_.pop();
    },
    peekState: function() {
      return this.stateStack_[this.stateStack_.length - 1];
    },
    transformObjectLiteral: function(tree) {
      var state = new State(this, null);
      this.pushState(state);
      this.pushState(state);
      var result = $__superGet(this, SuperTransformer.prototype, "transformObjectLiteral").call(this, tree);
      this.popState();
      this.popState();
      if (state.hasSuper) {
        this.registerTempVarName(state.tempName);
        return createAssignmentExpression(state.home, result);
      }
      this.releaseTempName(state.tempName);
      return result;
    },
    transformClassExpression: function(tree) {
      var superClass = this.transformAny(tree.superClass);
      var annotations = this.transformList(tree.annotations);
      var classState = new ClassState(this, tree);
      var prototypeState = new PrototypeState(this, classState);
      this.pushState(classState);
      this.pushState(prototypeState);
      var elements = this.transformList(tree.elements);
      this.popState();
      this.popState();
      if (tree.name === null && tree.superClass !== null) {
        classState.home;
      } else if (tree.superClass === superClass && tree.elements === elements && tree.annotations === annotations) {
        return tree;
      }
      return new ClassExpression(tree.location, classState.name, superClass, elements, tree.annotations, tree.typeParameters);
    },
    transformClassDeclaration: function(tree) {
      var superClass = this.transformAny(tree.superClass);
      var annotations = this.transformList(tree.annotations);
      var classState = new ClassState(this, tree);
      var prototypeState = new PrototypeState(this, classState);
      this.pushState(classState);
      this.pushState(prototypeState);
      var elements = this.transformList(tree.elements);
      this.popState();
      this.popState();
      if (tree.superClass === superClass && tree.elements === elements && tree.annotations === annotations) {
        return tree;
      }
      return new ClassDeclaration(tree.location, tree.name, superClass, elements, tree.annotations, tree.typeParameters);
    },
    transformMethod: function(tree) {
      var name = this.transformAny(tree.name);
      var prototypeState;
      if (tree.isStatic) {
        prototypeState = this.popState();
      }
      var parameterList = this.transformAny(tree.parameterList);
      var body = this.transformAny(tree.body);
      if (tree.isStatic) {
        this.pushState(prototypeState);
      }
      if (tree.name === name && tree.parameterList === parameterList && tree.body === body) {
        return tree;
      }
      return new Method(tree.location, tree.isStatic, tree.functionKind, name, parameterList, tree.typeAnnotation, tree.annotations, body, tree.debugName);
    },
    transformGetAccessor: function(tree) {
      var name = this.transformAny(tree.name);
      var prototypeState;
      if (tree.isStatic) {
        prototypeState = this.popState();
      }
      var body = this.transformAny(tree.body);
      if (tree.isStatic) {
        this.pushState(prototypeState);
      }
      if (tree.name === name && tree.body === body) {
        return tree;
      }
      return new GetAccessor(tree.location, tree.isStatic, name, tree.typeAnnotation, tree.annotations, body);
    },
    transformSetAccessor: function(tree) {
      var name = this.transformAny(tree.name);
      var prototypeState;
      if (tree.isStatic) {
        prototypeState = this.popState();
      }
      var parameterList = this.transformAny(tree.parameterList);
      var body = this.transformAny(tree.body);
      if (tree.isStatic) {
        this.pushState(prototypeState);
      }
      if (tree.name === name && tree.parameterList === parameterList && tree.body === body) {
        return tree;
      }
      return new SetAccessor(tree.location, tree.isStatic, name, parameterList, tree.annotations, body);
    },
    transformComputedPropertyName: function(tree) {
      var s1 = this.popState();
      var s2 = this.popState();
      var result = $__superGet(this, SuperTransformer.prototype, "transformComputedPropertyName").call(this, tree);
      this.pushState(s2);
      this.pushState(s1);
      return result;
    },
    transformSuperExpression: function(tree) {
      throw new Error('unreachable');
    },
    transformMemberShared_: function(name) {
      var home = this.peekState().home;
      var superGet = this.getRuntimeExpression('superGet');
      return parseExpression($__getTemplateObject(["", "(this, ", ", ", ")"]), superGet, home, name);
    },
    transformMemberExpression: function(tree) {
      if (tree.operand.type === SUPER_EXPRESSION) {
        return this.transformMemberShared_(tree.memberName.value);
      }
      return $__superGet(this, SuperTransformer.prototype, "transformMemberExpression").call(this, tree);
    },
    transformMemberLookupExpression: function(tree) {
      if (tree.operand.type === SUPER_EXPRESSION)
        return this.transformMemberShared_(tree.memberExpression);
      return $__superGet(this, SuperTransformer.prototype, "transformMemberLookupExpression").call(this, tree);
    },
    transformCallExpression: function(tree) {
      var operand,
          args;
      if (tree.operand.type === SUPER_EXPRESSION) {
        args = this.transformAny(tree.args);
        args = new ArgumentList(tree.location, $__spread([createThisExpression()], args.args));
        var home = this.stateStack_[this.stateStack_.length - 2].home;
        var superConstructor = this.getRuntimeExpression('superConstructor');
        operand = parseExpression($__getTemplateObject(["", "(", ")"]), superConstructor, home);
      } else if (hasSuperMemberExpression(tree.operand)) {
        operand = this.transformAny(tree.operand);
        args = this.transformAny(tree.args);
        args = new ArgumentList(args.location, $__spread([createThisExpression()], args.args));
      } else {
        return $__superGet(this, SuperTransformer.prototype, "transformCallExpression").call(this, tree);
      }
      return parseExpression($__getTemplateObject(["", ".call(", ")"]), operand, args);
    },
    transformBinaryExpression: function(tree) {
      if (tree.operator.isAssignmentOperator() && hasSuperMemberExpression(tree.left)) {
        if (tree.operator.type !== EQUAL) {
          var exploded = new ExplodeExpressionTransformer(this).transformAny(tree);
          return this.transformAny(createParenExpression(exploded));
        }
        var name = tree.left.type === MEMBER_LOOKUP_EXPRESSION ? tree.left.memberExpression : createStringLiteral(tree.left.memberName.value);
        var right = this.transformAny(tree.right);
        var home = this.peekState().home;
        var superSet = this.getRuntimeExpression('superSet');
        return parseExpression($__getTemplateObject(["", "(this, ", ", ", ", ", ")"]), superSet, home, name, right);
      }
      return $__superGet(this, SuperTransformer.prototype, "transformBinaryExpression").call(this, tree);
    },
    transformUnaryExpression: function(tree) {
      var transformed = this.transformIncrementDecrement_(tree);
      if (transformed)
        return transformed;
      return $__superGet(this, SuperTransformer.prototype, "transformUnaryExpression").call(this, tree);
    },
    transformPostfixExpression: function(tree) {
      var transformed = this.transformIncrementDecrement_(tree);
      if (transformed)
        return transformed;
      return $__superGet(this, SuperTransformer.prototype, "transformPostfixExpression").call(this, tree);
    },
    transformIncrementDecrement_: function(tree) {
      var operator = tree.operator;
      var operand = tree.operand;
      if ((operator.type === PLUS_PLUS || operator.type === MINUS_MINUS) && hasSuperMemberExpression(operand)) {
        var exploded = new ExplodeExpressionTransformer(this).transformAny(tree);
        if (exploded !== tree)
          exploded = createParenExpression(exploded);
        return this.transformAny(exploded);
      }
      return null;
    }
  }, {}, $__super);
}(ImportRuntimeTrait(TempVarTransformer));
