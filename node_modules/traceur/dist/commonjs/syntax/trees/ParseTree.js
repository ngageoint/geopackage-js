"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ParseTreeType: {
    enumerable: true,
    get: function() {
      return ParseTreeType;
    }
  },
  ParseTree: {
    enumerable: true,
    get: function() {
      return ParseTree;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var ParseTreeType = $__interopRequire("./ParseTreeType.js");
var $__3 = require("../TokenType.js"),
    IDENTIFIER = $__3.IDENTIFIER,
    STAR = $__3.STAR,
    STRING = $__3.STRING,
    VAR = $__3.VAR;
var Token = require("../Token.js").Token;
var utilJSON = $__interopRequire("../../util/JSON.js");
var $__5 = require("../PredefinedName.js"),
    ASYNC = $__5.ASYNC,
    ASYNC_STAR = $__5.ASYNC_STAR;
var $__6 = require("./ParseTreeType.js"),
    ARRAY_COMPREHENSION = $__6.ARRAY_COMPREHENSION,
    ARRAY_LITERAL = $__6.ARRAY_LITERAL,
    ARRAY_PATTERN = $__6.ARRAY_PATTERN,
    ARROW_FUNCTION = $__6.ARROW_FUNCTION,
    AWAIT_EXPRESSION = $__6.AWAIT_EXPRESSION,
    BINARY_EXPRESSION = $__6.BINARY_EXPRESSION,
    BINDING_IDENTIFIER = $__6.BINDING_IDENTIFIER,
    BLOCK = $__6.BLOCK,
    BREAK_STATEMENT = $__6.BREAK_STATEMENT,
    CALL_EXPRESSION = $__6.CALL_EXPRESSION,
    CLASS_DECLARATION = $__6.CLASS_DECLARATION,
    CLASS_EXPRESSION = $__6.CLASS_EXPRESSION,
    COMMA_EXPRESSION = $__6.COMMA_EXPRESSION,
    CONDITIONAL_EXPRESSION = $__6.CONDITIONAL_EXPRESSION,
    CONSTRUCTOR_TYPE = $__6.CONSTRUCTOR_TYPE,
    CONTINUE_STATEMENT = $__6.CONTINUE_STATEMENT,
    DEBUGGER_STATEMENT = $__6.DEBUGGER_STATEMENT,
    DO_WHILE_STATEMENT = $__6.DO_WHILE_STATEMENT,
    EMPTY_STATEMENT = $__6.EMPTY_STATEMENT,
    EXPORT_DECLARATION = $__6.EXPORT_DECLARATION,
    EXPRESSION_STATEMENT = $__6.EXPRESSION_STATEMENT,
    FOR_IN_STATEMENT = $__6.FOR_IN_STATEMENT,
    FOR_OF_STATEMENT = $__6.FOR_OF_STATEMENT,
    FOR_ON_STATEMENT = $__6.FOR_ON_STATEMENT,
    FOR_STATEMENT = $__6.FOR_STATEMENT,
    FORMAL_PARAMETER = $__6.FORMAL_PARAMETER,
    FUNCTION_DECLARATION = $__6.FUNCTION_DECLARATION,
    FUNCTION_EXPRESSION = $__6.FUNCTION_EXPRESSION,
    FUNCTION_TYPE = $__6.FUNCTION_TYPE,
    GENERATOR_COMPREHENSION = $__6.GENERATOR_COMPREHENSION,
    IDENTIFIER_EXPRESSION = $__6.IDENTIFIER_EXPRESSION,
    IF_STATEMENT = $__6.IF_STATEMENT,
    IMPORT_DECLARATION = $__6.IMPORT_DECLARATION,
    IMPORTED_BINDING = $__6.IMPORTED_BINDING,
    INTERFACE_DECLARATION = $__6.INTERFACE_DECLARATION,
    JSX_ELEMENT = $__6.JSX_ELEMENT,
    LABELLED_STATEMENT = $__6.LABELLED_STATEMENT,
    LITERAL_EXPRESSION = $__6.LITERAL_EXPRESSION,
    LITERAL_PROPERTY_NAME = $__6.LITERAL_PROPERTY_NAME,
    MEMBER_EXPRESSION = $__6.MEMBER_EXPRESSION,
    MEMBER_LOOKUP_EXPRESSION = $__6.MEMBER_LOOKUP_EXPRESSION,
    NEW_EXPRESSION = $__6.NEW_EXPRESSION,
    OBJECT_LITERAL = $__6.OBJECT_LITERAL,
    OBJECT_PATTERN = $__6.OBJECT_PATTERN,
    OBJECT_TYPE = $__6.OBJECT_TYPE,
    PAREN_EXPRESSION = $__6.PAREN_EXPRESSION,
    POSTFIX_EXPRESSION = $__6.POSTFIX_EXPRESSION,
    PREDEFINED_TYPE = $__6.PREDEFINED_TYPE,
    PROPERTY_NAME_SHORTHAND = $__6.PROPERTY_NAME_SHORTHAND,
    REST_PARAMETER = $__6.REST_PARAMETER,
    RETURN_STATEMENT = $__6.RETURN_STATEMENT,
    SPREAD_EXPRESSION = $__6.SPREAD_EXPRESSION,
    SPREAD_PATTERN_ELEMENT = $__6.SPREAD_PATTERN_ELEMENT,
    SUPER_EXPRESSION = $__6.SUPER_EXPRESSION,
    SWITCH_STATEMENT = $__6.SWITCH_STATEMENT,
    TEMPLATE_LITERAL_EXPRESSION = $__6.TEMPLATE_LITERAL_EXPRESSION,
    THIS_EXPRESSION = $__6.THIS_EXPRESSION,
    THROW_STATEMENT = $__6.THROW_STATEMENT,
    TRY_STATEMENT = $__6.TRY_STATEMENT,
    TYPE_ALIAS_DECLARATION = $__6.TYPE_ALIAS_DECLARATION,
    TYPE_NAME = $__6.TYPE_NAME,
    TYPE_REFERENCE = $__6.TYPE_REFERENCE,
    UNARY_EXPRESSION = $__6.UNARY_EXPRESSION,
    VARIABLE_DECLARATION = $__6.VARIABLE_DECLARATION,
    VARIABLE_STATEMENT = $__6.VARIABLE_STATEMENT,
    WHILE_STATEMENT = $__6.WHILE_STATEMENT,
    WITH_STATEMENT = $__6.WITH_STATEMENT,
    YIELD_EXPRESSION = $__6.YIELD_EXPRESSION;
var ParseTree = function() {
  function ParseTree(location) {
    this.location = location;
  }
  return ($__createClass)(ParseTree, {
    isPattern: function() {
      switch (this.type) {
        case ARRAY_PATTERN:
        case OBJECT_PATTERN:
          return true;
        default:
          return false;
      }
    },
    isLeftHandSideExpression: function() {
      switch (this.type) {
        case ARRAY_PATTERN:
        case IDENTIFIER_EXPRESSION:
        case MEMBER_EXPRESSION:
        case MEMBER_LOOKUP_EXPRESSION:
        case OBJECT_PATTERN:
          return true;
        case PAREN_EXPRESSION:
          return this.expression.isLeftHandSideExpression();
        default:
          return false;
      }
    },
    isAssignmentExpression: function() {
      switch (this.type) {
        case ARRAY_COMPREHENSION:
        case ARRAY_LITERAL:
        case ARROW_FUNCTION:
        case AWAIT_EXPRESSION:
        case BINARY_EXPRESSION:
        case CALL_EXPRESSION:
        case CLASS_EXPRESSION:
        case CONDITIONAL_EXPRESSION:
        case FUNCTION_EXPRESSION:
        case GENERATOR_COMPREHENSION:
        case IDENTIFIER_EXPRESSION:
        case JSX_ELEMENT:
        case LITERAL_EXPRESSION:
        case MEMBER_EXPRESSION:
        case MEMBER_LOOKUP_EXPRESSION:
        case NEW_EXPRESSION:
        case OBJECT_LITERAL:
        case PAREN_EXPRESSION:
        case POSTFIX_EXPRESSION:
        case TEMPLATE_LITERAL_EXPRESSION:
        case SUPER_EXPRESSION:
        case THIS_EXPRESSION:
        case UNARY_EXPRESSION:
        case YIELD_EXPRESSION:
          return true;
        default:
          return false;
      }
    },
    isMemberExpression: function() {
      switch (this.type) {
        case THIS_EXPRESSION:
        case CLASS_EXPRESSION:
        case SUPER_EXPRESSION:
        case IDENTIFIER_EXPRESSION:
        case JSX_ELEMENT:
        case LITERAL_EXPRESSION:
        case ARRAY_LITERAL:
        case OBJECT_LITERAL:
        case PAREN_EXPRESSION:
        case TEMPLATE_LITERAL_EXPRESSION:
        case FUNCTION_EXPRESSION:
        case MEMBER_LOOKUP_EXPRESSION:
        case MEMBER_EXPRESSION:
        case CALL_EXPRESSION:
          return true;
        case NEW_EXPRESSION:
          return this.args !== null;
      }
      return false;
    },
    isExpression: function() {
      return this.isAssignmentExpression() || this.type === COMMA_EXPRESSION;
    },
    isAssignmentOrSpread: function() {
      return this.isAssignmentExpression() || this.type === SPREAD_EXPRESSION;
    },
    isRestParameter: function() {
      return this.type === REST_PARAMETER || (this.type === FORMAL_PARAMETER && this.parameter.isRestParameter());
    },
    isSpreadPatternElement: function() {
      return this.type === SPREAD_PATTERN_ELEMENT;
    },
    isStatementListItem: function() {
      return this.isStatement() || this.isDeclaration() || this.type === TYPE_ALIAS_DECLARATION;
    },
    isStatement: function() {
      switch (this.type) {
        case BLOCK:
        case VARIABLE_STATEMENT:
        case EMPTY_STATEMENT:
        case EXPRESSION_STATEMENT:
        case IF_STATEMENT:
        case CONTINUE_STATEMENT:
        case BREAK_STATEMENT:
        case RETURN_STATEMENT:
        case WITH_STATEMENT:
        case LABELLED_STATEMENT:
        case THROW_STATEMENT:
        case TRY_STATEMENT:
        case DEBUGGER_STATEMENT:
          return true;
      }
      return this.isBreakableStatement();
    },
    isDeclaration: function() {
      switch (this.type) {
        case FUNCTION_DECLARATION:
        case CLASS_DECLARATION:
          return true;
      }
      return this.isLexicalDeclaration();
    },
    isLexicalDeclaration: function() {
      switch (this.type) {
        case VARIABLE_STATEMENT:
          return this.declarations.declarationType !== VAR;
      }
      return false;
    },
    isBreakableStatement: function() {
      switch (this.type) {
        case SWITCH_STATEMENT:
          return true;
      }
      return this.isIterationStatement();
    },
    isIterationStatement: function() {
      switch (this.type) {
        case DO_WHILE_STATEMENT:
        case FOR_IN_STATEMENT:
        case FOR_OF_STATEMENT:
        case FOR_ON_STATEMENT:
        case FOR_STATEMENT:
        case WHILE_STATEMENT:
          return true;
      }
      return false;
    },
    isScriptElement: function() {
      switch (this.type) {
        case CLASS_DECLARATION:
        case EXPORT_DECLARATION:
        case FUNCTION_DECLARATION:
        case IMPORT_DECLARATION:
        case INTERFACE_DECLARATION:
        case VARIABLE_DECLARATION:
        case TYPE_ALIAS_DECLARATION:
          return true;
      }
      return this.isStatement();
    },
    isGenerator: function() {
      return this.functionKind !== null && this.functionKind.type === STAR;
    },
    isAsyncFunction: function() {
      return this.functionKind !== null && this.functionKind.type === IDENTIFIER && this.functionKind.value === ASYNC;
    },
    isAsyncGenerator: function() {
      return this.functionKind !== null && this.functionKind.type === IDENTIFIER && this.functionKind.value === ASYNC_STAR;
    },
    isType: function() {
      switch (this.type) {
        case CONSTRUCTOR_TYPE:
        case FUNCTION_TYPE:
        case OBJECT_TYPE:
        case PREDEFINED_TYPE:
        case TYPE_NAME:
        case TYPE_REFERENCE:
          return true;
      }
      return false;
    },
    getDirectivePrologueStringToken_: function() {
      var tree = this;
      if (tree.type !== EXPRESSION_STATEMENT || !(tree = tree.expression))
        return null;
      if (tree.type !== LITERAL_EXPRESSION || !(tree = tree.literalToken))
        return null;
      if (tree.type !== STRING)
        return null;
      return tree;
    },
    isDirectivePrologue: function() {
      return this.getDirectivePrologueStringToken_() !== null;
    },
    isUseStrictDirective: function() {
      var token = this.getDirectivePrologueStringToken_();
      if (!token)
        return false;
      var v = token.value;
      return v === '"use strict"' || v === "'use strict'";
    },
    toJSON: function() {
      return utilJSON.transform(this, ParseTree.replacer);
    },
    stringify: function() {
      var indent = arguments[0] !== (void 0) ? arguments[0] : 2;
      return JSON.stringify(this, ParseTree.replacer, indent);
    },
    getStringValue: function() {
      switch (this.type) {
        case IDENTIFIER_EXPRESSION:
        case BINDING_IDENTIFIER:
          return this.identifierToken.toString();
        case IMPORTED_BINDING:
          return this.binding.getStringValue();
        case PROPERTY_NAME_SHORTHAND:
          return this.name.toString();
        case LITERAL_PROPERTY_NAME:
          return this.literalToken.toString();
      }
      throw new Error('Not yet implemented');
    }
  }, {
    stripLocation: function(key, value) {
      if (key === 'location') {
        return undefined;
      }
      return value;
    },
    replacer: function(k, v) {
      if (v instanceof ParseTree || v instanceof Token) {
        var rv = {type: v.type};
        Object.keys(v).forEach(function(name) {
          if (name !== 'location')
            rv[name] = v[name];
        });
        return rv;
      }
      return v;
    }
  });
}();
