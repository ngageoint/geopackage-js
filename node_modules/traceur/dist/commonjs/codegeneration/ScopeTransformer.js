"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ScopeTransformer: {
    enumerable: true,
    get: function() {
      return ScopeTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__7 = require("../syntax/PredefinedName.js"),
    ARGUMENTS = $__7.ARGUMENTS,
    THIS = $__7.THIS;
var FindInFunctionScope = require("./FindInFunctionScope.js").FindInFunctionScope;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__10 = require("../syntax/trees/ParseTrees.js"),
    FunctionDeclaration = $__10.FunctionDeclaration,
    FunctionExpression = $__10.FunctionExpression,
    GetAccessor = $__10.GetAccessor,
    Method = $__10.Method,
    SetAccessor = $__10.SetAccessor;
var StringSet = require("../util/StringSet.js").StringSet;
var VARIABLE_DECLARATION_LIST = require("../syntax/trees/ParseTreeType.js").VARIABLE_DECLARATION_LIST;
var VAR = require("../syntax/TokenType.js").VAR;
var $__14 = require("../semantics/VariableBinder.js"),
    variablesInBlock = $__14.variablesInBlock,
    variablesInFunction = $__14.variablesInFunction;
var FindNames = function($__super) {
  function FindNames(names) {
    $__superConstructor(FindNames).call(this);
    this.names = names;
  }
  return ($__createClass)(FindNames, {visitBindingIdentifier: function(tree) {
      this.names.add(tree.getStringValue());
    }}, {}, $__super);
}(FindInFunctionScope);
function getLexicalBindingNames(tree) {
  var names = new StringSet();
  if (tree !== null && tree.type === VARIABLE_DECLARATION_LIST && tree.declarationType !== VAR) {
    var visitor = new FindNames(names);
    for (var i = 0; i < tree.declarations.length; i++) {
      visitor.visitAny(tree.declarations[i].lvalue);
    }
  }
  return names;
}
var ScopeTransformer = function($__super) {
  function ScopeTransformer(varName) {
    $__superConstructor(ScopeTransformer).call(this);
    this.varName_ = varName;
  }
  return ($__createClass)(ScopeTransformer, {
    transformBlock: function(tree) {
      if (variablesInBlock(tree).has(this.varName_)) {
        return tree;
      }
      return $__superGet(this, ScopeTransformer.prototype, "transformBlock").call(this, tree);
    },
    sameTreeIfNameInLoopInitializer_: function(tree) {
      var names = getLexicalBindingNames(tree.initializer);
      if (names.has(this.varName_)) {
        return tree;
      }
      return null;
    },
    transformForStatement: function(tree) {
      return this.sameTreeIfNameInLoopInitializer_(tree) || $__superGet(this, ScopeTransformer.prototype, "transformForStatement").call(this, tree);
    },
    transformForInStatement: function(tree) {
      return this.sameTreeIfNameInLoopInitializer_(tree) || $__superGet(this, ScopeTransformer.prototype, "transformForInStatement").call(this, tree);
    },
    transformForOfStatement: function(tree) {
      return this.sameTreeIfNameInLoopInitializer_(tree) || $__superGet(this, ScopeTransformer.prototype, "transformForOfStatement").call(this, tree);
    },
    transformForOnStatement: function(tree) {
      return this.sameTreeIfNameInLoopInitializer_(tree) || $__superGet(this, ScopeTransformer.prototype, "transformForOnStatement").call(this, tree);
    },
    transformThisExpression: function(tree) {
      if (this.varName_ !== THIS)
        return tree;
      return $__superGet(this, ScopeTransformer.prototype, "transformThisExpression").call(this, tree);
    },
    transformParameterListAndBody_: function(tree) {
      if (this.getDoNotRecurse(tree))
        return tree;
      return {
        parameterList: this.transformAny(tree.parameterList),
        body: this.transformAny(tree.body)
      };
    },
    transformFunctionDeclaration: function(tree) {
      var name = this.transformAny(tree.name);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var $__3 = this.transformParameterListAndBody_(tree),
          parameterList = $__3.parameterList,
          body = $__3.body;
      if (name === tree.name && parameterList === tree.parameterList && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
        return tree;
      }
      return new FunctionDeclaration(tree.location, name, tree.functionKind, parameterList, typeAnnotation, annotations, body);
    },
    transformFunctionExpression: function(tree) {
      var name = this.transformAny(tree.name);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var $__3 = this.transformParameterListAndBody_(tree),
          parameterList = $__3.parameterList,
          body = $__3.body;
      if (name === tree.name && parameterList === tree.parameterList && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
        return tree;
      }
      return new FunctionExpression(tree.location, name, tree.functionKind, parameterList, typeAnnotation, annotations, body);
    },
    transformMethod: function(tree) {
      var name = this.transformAny(tree.name);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var $__3 = this.transformParameterListAndBody_(tree),
          parameterList = $__3.parameterList,
          body = $__3.body;
      if (name === tree.name && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && parameterList === tree.parameterList && body === tree.body) {
        return tree;
      }
      return new Method(tree.location, tree.isStatic, tree.functionKind, name, parameterList, typeAnnotation, annotations, body, tree.debugName);
    },
    transformGetAccessor: function(tree) {
      var name = this.transformAny(tree.name);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var body = this.getDoNotRecurse(tree) ? tree.body : this.transformAny(tree.body);
      if (name === tree.name && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
        return tree;
      }
      return new GetAccessor(tree.location, tree.isStatic, name, typeAnnotation, annotations, body);
    },
    transformSetAccessor: function(tree) {
      var name = this.transformAny(tree.name);
      var annotations = this.transformList(tree.annotations);
      var $__3 = this.transformParameterListAndBody_(tree),
          parameterList = $__3.parameterList,
          body = $__3.body;
      if (name === tree.name && annotations === tree.annotations && parameterList === tree.parameterList && body === tree.body) {
        return tree;
      }
      return new SetAccessor(tree.location, tree.isStatic, name, parameterList, annotations, body);
    },
    getDoNotRecurse: function(tree) {
      return this.varName_ === ARGUMENTS || this.varName_ === THIS || variablesInFunction(tree).has(this.varName_);
    },
    transformCatch: function(tree) {
      if (!tree.binding.isPattern() && this.varName_ === tree.binding.identifierToken.value) {
        return tree;
      }
      return $__superGet(this, ScopeTransformer.prototype, "transformCatch").call(this, tree);
    }
  }, {}, $__super);
}(ParseTreeTransformer);
