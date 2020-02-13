"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  variablesInBlock: {
    enumerable: true,
    get: function() {
      return variablesInBlock;
    }
  },
  variablesInFunction: {
    enumerable: true,
    get: function() {
      return variablesInFunction;
    }
  }
});
var ScopeChainBuilder = require("./ScopeChainBuilder.js").ScopeChainBuilder;
function variablesInBlock(tree) {
  var includeFunctionScope = arguments[1];
  var builder = new ScopeChainBuilder(null);
  builder.visitAny(tree);
  var scope = builder.getScopeForTree(tree);
  var names = scope.getLexicalBindingNames();
  if (!includeFunctionScope) {
    return names;
  }
  var variableBindingNames = scope.getVariableBindingNames();
  variableBindingNames.forEach(function(name) {
    return names.add(name);
  });
  return names;
}
function variablesInFunction(tree) {
  var builder = new ScopeChainBuilder(null);
  builder.visitAny(tree);
  var scope = builder.getScopeForTree(tree);
  return scope.getAllBindingNames();
}
