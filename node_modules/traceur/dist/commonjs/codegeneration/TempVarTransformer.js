"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  TempVarTransformer: {
    enumerable: true,
    get: function() {
      return TempVarTransformer;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var ParseTreeTransformer = require("./ParseTreeTransformer.js").ParseTreeTransformer;
var $__8 = require("../syntax/trees/ParseTrees.js"),
    Module = $__8.Module,
    Script = $__8.Script;
var ARGUMENTS = require("../syntax/PredefinedName.js").ARGUMENTS;
var StringSet = require("../util/StringSet.js").StringSet;
var $__11 = require("../syntax/TokenType.js"),
    LET = $__11.LET,
    VAR = $__11.VAR;
var $__12 = require("./ParseTreeFactory.js"),
    createFunctionBody = $__12.createFunctionBody,
    createThisExpression = $__12.createThisExpression,
    createIdentifierExpression = $__12.createIdentifierExpression,
    createVariableDeclaration = $__12.createVariableDeclaration,
    createVariableDeclarationList = $__12.createVariableDeclarationList,
    createVariableStatement = $__12.createVariableStatement;
var prependStatements = require("./PrependStatements.js").prependStatements;
var TempVarStatement = function() {
  function TempVarStatement(name, initializer) {
    this.name = name;
    this.initializer = initializer;
  }
  return ($__createClass)(TempVarStatement, {}, {});
}();
var TempScope = function() {
  function TempScope() {
    this.identifiers = [];
  }
  return ($__createClass)(TempScope, {
    push: function(identifier) {
      this.identifiers.push(identifier);
    },
    pop: function() {
      return this.identifiers.pop();
    },
    release: function(obj) {
      for (var i = this.identifiers.length - 1; i >= 0; i--) {
        obj.releaseTempName(this.identifiers[i]);
      }
    }
  }, {});
}();
var VarScope = function() {
  function VarScope(options) {
    this.thisName = null;
    this.argumentName = null;
    this.tempVarStatements = [];
    this.declarationType_ = options.blockBinding && !options.transformOptions.blockBinding ? LET : VAR;
  }
  return ($__createClass)(VarScope, {
    push: function(tempVarStatement) {
      this.tempVarStatements.push(tempVarStatement);
    },
    pop: function() {
      return this.tempVarStatements.pop();
    },
    release: function(obj) {
      for (var i = this.tempVarStatements.length - 1; i >= 0; i--) {
        obj.releaseTempName(this.tempVarStatements[i].name);
      }
    },
    isEmpty: function() {
      return !this.tempVarStatements.length;
    },
    createVariableStatement: function() {
      var declarations = [];
      var seenNames = new StringSet();
      for (var i = 0; i < this.tempVarStatements.length; i++) {
        var $__4 = this.tempVarStatements[i],
            name = $__4.name,
            initializer = $__4.initializer;
        if (seenNames.has(name)) {
          if (initializer)
            throw new Error('Invalid use of TempVarTransformer');
          continue;
        }
        seenNames.add(name);
        declarations.push(createVariableDeclaration(name, initializer));
      }
      return createVariableStatement(createVariableDeclarationList(this.declarationType_, declarations));
    }
  }, {});
}();
var TempVarTransformer = function($__super) {
  function TempVarTransformer(identifierGenerator, reporter, options) {
    $__superConstructor(TempVarTransformer).call(this);
    this.identifierGenerator = identifierGenerator;
    this.reporter = reporter;
    this.options = options;
    this.tempVarStack_ = [new VarScope(this.options)];
    this.tempScopeStack_ = [new TempScope()];
    this.namePool_ = [];
  }
  return ($__createClass)(TempVarTransformer, {
    transformStatements_: function(statements) {
      this.tempVarStack_.push(new VarScope(this.options));
      var transformedStatements = this.transformList(statements);
      var vars = this.tempVarStack_.pop();
      if (vars.isEmpty())
        return transformedStatements;
      var variableStatement = vars.createVariableStatement();
      vars.release(this);
      return prependStatements(transformedStatements, variableStatement);
    },
    transformScript: function(tree) {
      var scriptItemList = this.transformStatements_(tree.scriptItemList);
      if (scriptItemList === tree.scriptItemList) {
        return tree;
      }
      return new Script(tree.location, scriptItemList, tree.moduleName);
    },
    transformModule: function(tree) {
      var scriptItemList = this.transformStatements_(tree.scriptItemList);
      if (scriptItemList === tree.scriptItemList) {
        return tree;
      }
      return new Module(tree.location, scriptItemList, tree.moduleName);
    },
    transformFunctionBody: function(tree) {
      this.pushTempScope();
      var statements = this.transformStatements_(tree.statements);
      this.popTempScope();
      if (statements === tree.statements)
        return tree;
      return createFunctionBody(statements);
    },
    getTempIdentifier: function() {
      var name = this.getName_();
      this.tempScopeStack_[this.tempScopeStack_.length - 1].push(name);
      return name;
    },
    getName_: function() {
      return this.namePool_.length ? this.namePool_.pop() : this.identifierGenerator.generateUniqueIdentifier();
    },
    addTempVar: function() {
      var initializer = arguments[0] !== (void 0) ? arguments[0] : null;
      var vars = this.tempVarStack_[this.tempVarStack_.length - 1];
      var name = this.getName_();
      vars.push(new TempVarStatement(name, initializer));
      return name;
    },
    registerTempVarName: function(name) {
      var vars = this.tempVarStack_[this.tempVarStack_.length - 1];
      vars.push(new TempVarStatement(name, null));
    },
    addTempVarForThis: function() {
      var varScope = this.tempVarStack_[this.tempVarStack_.length - 1];
      return varScope.thisName || (varScope.thisName = this.addTempVar(createThisExpression()));
    },
    addTempVarForArguments: function() {
      var varScope = this.tempVarStack_[this.tempVarStack_.length - 1];
      return varScope.argumentName || (varScope.argumentName = this.addTempVar(createIdentifierExpression(ARGUMENTS)));
    },
    pushTempScope: function() {
      this.tempScopeStack_.push(new TempScope());
    },
    popTempScope: function() {
      this.tempScopeStack_.pop().release(this);
    },
    releaseTempName: function(name) {
      this.namePool_.push(name);
    }
  }, {}, $__super);
}(ParseTreeTransformer);
