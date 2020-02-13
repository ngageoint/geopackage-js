"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ParseTreeWriter: {
    enumerable: true,
    get: function() {
      return ParseTreeWriter;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__7 = require("../syntax/trees/ParseTreeType.js"),
    BLOCK = $__7.BLOCK,
    CLASS_DECLARATION = $__7.CLASS_DECLARATION,
    FUNCTION_DECLARATION = $__7.FUNCTION_DECLARATION,
    IF_STATEMENT = $__7.IF_STATEMENT,
    LITERAL_EXPRESSION = $__7.LITERAL_EXPRESSION,
    POSTFIX_EXPRESSION = $__7.POSTFIX_EXPRESSION,
    UNARY_EXPRESSION = $__7.UNARY_EXPRESSION;
var ParseTreeVisitor = require("../syntax/ParseTreeVisitor.js").ParseTreeVisitor;
var $__9 = require("../syntax/PredefinedName.js"),
    AS = $__9.AS,
    ASYNC = $__9.ASYNC,
    AWAIT = $__9.AWAIT,
    FROM = $__9.FROM,
    GET = $__9.GET,
    OF = $__9.OF,
    ON = $__9.ON,
    SET = $__9.SET,
    TYPE = $__9.TYPE;
var $__10 = require("../syntax/Scanner.js"),
    isIdentifierPart = $__10.isIdentifierPart,
    isWhitespace = $__10.isWhitespace;
var $__11 = require("../syntax/TokenType.js"),
    ARROW = $__11.ARROW,
    AT = $__11.AT,
    BACK_QUOTE = $__11.BACK_QUOTE,
    BAR = $__11.BAR,
    BREAK = $__11.BREAK,
    CASE = $__11.CASE,
    CATCH = $__11.CATCH,
    CLASS = $__11.CLASS,
    CLOSE_ANGLE = $__11.CLOSE_ANGLE,
    CLOSE_CURLY = $__11.CLOSE_CURLY,
    CLOSE_PAREN = $__11.CLOSE_PAREN,
    CLOSE_SQUARE = $__11.CLOSE_SQUARE,
    COLON = $__11.COLON,
    COMMA = $__11.COMMA,
    CONTINUE = $__11.CONTINUE,
    DEBUGGER = $__11.DEBUGGER,
    DEFAULT = $__11.DEFAULT,
    DO = $__11.DO,
    DOT_DOT_DOT = $__11.DOT_DOT_DOT,
    ELSE = $__11.ELSE,
    EQUAL = $__11.EQUAL,
    EXPORT = $__11.EXPORT,
    EXTENDS = $__11.EXTENDS,
    FINALLY = $__11.FINALLY,
    FOR = $__11.FOR,
    FUNCTION = $__11.FUNCTION,
    IF = $__11.IF,
    IMPORT = $__11.IMPORT,
    IN = $__11.IN,
    INTERFACE = $__11.INTERFACE,
    MINUS = $__11.MINUS,
    MINUS_MINUS = $__11.MINUS_MINUS,
    NEW = $__11.NEW,
    NUMBER = $__11.NUMBER,
    OPEN_ANGLE = $__11.OPEN_ANGLE,
    OPEN_CURLY = $__11.OPEN_CURLY,
    OPEN_PAREN = $__11.OPEN_PAREN,
    OPEN_SQUARE = $__11.OPEN_SQUARE,
    PERIOD = $__11.PERIOD,
    PLUS = $__11.PLUS,
    PLUS_PLUS = $__11.PLUS_PLUS,
    QUESTION = $__11.QUESTION,
    RETURN = $__11.RETURN,
    SEMI_COLON = $__11.SEMI_COLON,
    SLASH = $__11.SLASH,
    STAR = $__11.STAR,
    STATIC = $__11.STATIC,
    SUPER = $__11.SUPER,
    SWITCH = $__11.SWITCH,
    THIS = $__11.THIS,
    THROW = $__11.THROW,
    TRY = $__11.TRY,
    WHILE = $__11.WHILE,
    WITH = $__11.WITH,
    YIELD = $__11.YIELD;
var NEW_LINE = '\n';
var LINE_LENGTH = 80;
var ParseTreeWriter = function($__super) {
  function ParseTreeWriter() {
    var $__3;
    var $__2 = arguments[0] !== (void 0) ? arguments[0] : {},
        prettyPrint = ($__3 = $__2.prettyPrint) === void 0 ? true : $__3;
    $__superConstructor(ParseTreeWriter).call(this);
    this.prettyPrint_ = prettyPrint;
    this.result_ = '';
    this.currentLine_ = '';
    this.lastCode_ = -1;
    this.indentDepth_ = 0;
    this.currentParameterTypeAnnotation_ = null;
  }
  return ($__createClass)(ParseTreeWriter, {
    toString: function() {
      if (this.currentLine_.length > 0) {
        this.result_ += this.currentLine_;
        this.currentLine_ = '';
        this.lastCode_ = -1;
      }
      return this.result_;
    },
    visitAnnotation: function(tree) {
      this.write_(AT);
      this.visitAny(tree.name);
      if (tree.args !== null) {
        this.write_(OPEN_PAREN);
        this.writeList_(tree.args.args, COMMA, false);
        this.write_(CLOSE_PAREN);
      }
    },
    visitArgumentList: function(tree) {
      this.write_(OPEN_PAREN);
      this.writeList_(tree.args, COMMA, false);
      this.write_(CLOSE_PAREN);
    },
    visitArrayComprehension: function(tree) {
      this.write_(OPEN_SQUARE);
      this.visitList(tree.comprehensionList);
      this.visitAny(tree.expression);
      this.write_(CLOSE_SQUARE);
    },
    visitArrayLiteral: function(tree) {
      this.write_(OPEN_SQUARE);
      this.writeList_(tree.elements, COMMA, false);
      if (tree.elements[tree.elements.length - 1] === null) {
        this.write_(COMMA);
        this.writeSpace_();
      }
      this.write_(CLOSE_SQUARE);
    },
    visitArrayPattern: function(tree) {
      this.write_(OPEN_SQUARE);
      this.writeList_(tree.elements, COMMA, false);
      if (tree.elements[tree.elements.length - 1] === null) {
        this.write_(COMMA);
        this.writeSpace_();
      }
      this.write_(CLOSE_SQUARE);
    },
    visitArrayType: function(tree) {
      this.visitAny(tree.elementType);
      this.write_(OPEN_SQUARE);
      this.write_(CLOSE_SQUARE);
    },
    visitArrowFunction: function(tree) {
      if (tree.functionKind) {
        this.writeToken_(tree.functionKind);
        this.writeSpace_();
      }
      this.write_(OPEN_PAREN);
      this.visitAny(tree.parameterList);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
      this.write_(ARROW);
      this.writeSpace_();
      this.visitAny(tree.body);
    },
    visitAssignmentElement: function(tree) {
      this.visitAny(tree.assignment);
      if (tree.initializer) {
        this.writeSpace_();
        this.write_(EQUAL);
        this.writeSpace_();
        this.visitAny(tree.initializer);
      }
    },
    visitAwaitExpression: function(tree) {
      this.write_(AWAIT);
      this.writeSpace_();
      this.visitAny(tree.expression);
    },
    visitBinaryExpression: function(tree) {
      var left = tree.left;
      this.visitAny(left);
      var operator = tree.operator;
      if (left.type === POSTFIX_EXPRESSION && requiresSpaceBetween(left.operator.type, operator.type)) {
        this.writeRequiredSpace_();
      } else {
        this.writeSpace_();
      }
      this.writeToken_(operator);
      var right = tree.right;
      if (right.type === UNARY_EXPRESSION && requiresSpaceBetween(operator.type, right.operator.type)) {
        this.writeRequiredSpace_();
      } else {
        this.writeSpace_();
      }
      this.visitAny(right);
    },
    visitBindingElement: function(tree) {
      var typeAnnotation = this.currentParameterTypeAnnotation_;
      this.currentParameterTypeAnnotation_ = null;
      this.visitAny(tree.binding);
      this.writeTypeAnnotation_(typeAnnotation);
      if (tree.initializer) {
        this.writeSpace_();
        this.write_(EQUAL);
        this.writeSpace_();
        this.visitAny(tree.initializer);
      }
    },
    visitBindingIdentifier: function(tree) {
      this.writeToken_(tree.identifierToken);
    },
    visitBlock: function(tree) {
      this.writeOpenCurly_();
      this.writelnList_(tree.statements, null);
      this.writeCloseCurly_();
    },
    visitBreakStatement: function(tree) {
      this.write_(BREAK);
      if (tree.name !== null) {
        this.writeSpace_();
        this.writeToken_(tree.name);
      }
      this.write_(SEMI_COLON);
    },
    visitCallExpression: function(tree) {
      this.visitAny(tree.operand);
      this.visitAny(tree.args);
    },
    visitCallSignature: function(tree) {
      if (tree.typeParameters) {
        this.visitAny(tree.typeParameters);
      }
      this.write_(OPEN_PAREN);
      this.visitAny(tree.parameterList);
      this.write_(CLOSE_PAREN);
      this.writeTypeAnnotation_(tree.returnType);
    },
    visitCaseClause: function(tree) {
      this.write_(CASE);
      this.writeSpace_();
      this.visitAny(tree.expression);
      this.write_(COLON);
      this.indentDepth_++;
      this.writelnList_(tree.statements, null);
      this.indentDepth_--;
    },
    visitCatch: function(tree) {
      this.write_(CATCH);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.binding);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
      this.visitAny(tree.catchBody);
    },
    visitClassShared_: function(tree) {
      this.writeAnnotations_(tree.annotations);
      this.write_(CLASS);
      this.writeSpace_();
      this.visitAny(tree.name);
      if (tree.typeParameters !== null) {
        this.visitAny(tree.typeParameters);
      }
      if (tree.superClass !== null) {
        this.writeSpace_();
        this.write_(EXTENDS);
        this.writeSpace_();
        this.visitAny(tree.superClass);
      }
      this.writeSpace_();
      this.writeOpenCurly_();
      this.writelnList_(tree.elements, null);
      this.writeCloseCurly_();
    },
    visitClassDeclaration: function(tree) {
      this.visitClassShared_(tree);
    },
    visitClassExpression: function(tree) {
      this.visitClassShared_(tree);
    },
    visitCommaExpression: function(tree) {
      this.writeList_(tree.expressions, COMMA, false);
    },
    visitComprehensionFor: function(tree) {
      this.write_(FOR);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.left);
      this.writeSpace_();
      this.write_(OF);
      this.writeSpace_();
      this.visitAny(tree.iterator);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
    },
    visitComprehensionIf: function(tree) {
      this.write_(IF);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.expression);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
    },
    visitComputedPropertyName: function(tree) {
      this.write_(OPEN_SQUARE);
      this.visitAny(tree.expression);
      this.write_(CLOSE_SQUARE);
    },
    visitConstructSignature: function(tree) {
      this.write_(NEW);
      this.writeSpace_();
      this.visitCallSignature(tree);
    },
    visitConstructorType: function(tree) {
      this.write_(NEW);
      this.writeSpace_();
      this.visitFunctionType(tree);
    },
    visitConditionalExpression: function(tree) {
      this.visitAny(tree.condition);
      this.writeSpace_();
      this.write_(QUESTION);
      this.writeSpace_();
      this.visitAny(tree.left);
      this.writeSpace_();
      this.write_(COLON);
      this.writeSpace_();
      this.visitAny(tree.right);
    },
    visitContinueStatement: function(tree) {
      this.write_(CONTINUE);
      if (tree.name !== null) {
        this.writeSpace_();
        this.writeToken_(tree.name);
      }
      this.write_(SEMI_COLON);
    },
    visitCoverInitializedName: function(tree) {
      this.writeToken_(tree.name);
      this.writeSpace_();
      this.writeToken_(tree.equalToken);
      this.writeSpace_();
      this.visitAny(tree.initializer);
    },
    visitDebuggerStatement: function(tree) {
      this.write_(DEBUGGER);
      this.write_(SEMI_COLON);
    },
    visitDefaultClause: function(tree) {
      this.write_(DEFAULT);
      this.write_(COLON);
      this.indentDepth_++;
      this.writelnList_(tree.statements, null);
      this.indentDepth_--;
    },
    visitDoWhileStatement: function(tree) {
      this.write_(DO);
      this.visitAnyBlockOrIndent_(tree.body);
      this.writeSpace_();
      this.write_(WHILE);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.condition);
      this.write_(CLOSE_PAREN);
      this.write_(SEMI_COLON);
    },
    visitEmptyStatement: function(tree) {
      this.write_(SEMI_COLON);
    },
    visitExportDeclaration: function(tree) {
      this.writeAnnotations_(tree.annotations);
      this.write_(EXPORT);
      this.writeSpace_();
      this.visitAny(tree.declaration);
    },
    visitExportDefault: function(tree) {
      this.write_(DEFAULT);
      this.writeSpace_();
      this.visitAny(tree.expression);
      switch (tree.expression.type) {
        case CLASS_DECLARATION:
        case FUNCTION_DECLARATION:
          break;
        default:
          this.write_(SEMI_COLON);
      }
    },
    visitNameSpaceExport: function(tree) {
      this.write_(STAR);
      this.writeSpace_();
      this.write_(AS);
      this.writeSpace_();
      this.writeToken_(tree.name);
    },
    visitNameSpaceImport: function(tree) {
      this.write_(STAR);
      this.writeSpace_();
      this.write_(AS);
      this.writeSpace_();
      this.visitAny(tree.binding);
    },
    visitNamedExport: function(tree) {
      this.visitAny(tree.exportClause);
      if (tree.moduleSpecifier) {
        this.writeSpace_();
        this.write_(FROM);
        this.writeSpace_();
        this.visitAny(tree.moduleSpecifier);
      }
      this.write_(SEMI_COLON);
    },
    visitExportSpecifier: function(tree) {
      this.writeToken_(tree.lhs);
      if (tree.rhs) {
        this.writeSpace_();
        this.write_(AS);
        this.writeSpace_();
        this.writeToken_(tree.rhs);
      }
    },
    visitExportSpecifierSet: function(tree) {
      this.writeOpenCurly_();
      this.writeList_(tree.specifiers, COMMA, false);
      this.writeCloseCurly_();
    },
    visitExportStar: function(tree) {
      this.write_(STAR);
    },
    visitExpressionStatement: function(tree) {
      this.visitAny(tree.expression);
      this.write_(SEMI_COLON);
    },
    visitFinally: function(tree) {
      this.write_(FINALLY);
      this.writeSpace_();
      this.visitAny(tree.block);
    },
    visitForOfStatement: function(tree) {
      this.write_(FOR);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.initializer);
      this.writeSpace_();
      this.write_(OF);
      this.writeSpace_();
      this.visitAny(tree.collection);
      this.write_(CLOSE_PAREN);
      this.visitAnyBlockOrIndent_(tree.body);
    },
    visitForOnStatement: function(tree) {
      this.write_(FOR);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.initializer);
      this.writeSpace_();
      this.write_(ON);
      this.writeSpace_();
      this.visitAny(tree.observable);
      this.write_(CLOSE_PAREN);
      this.visitAnyBlockOrIndent_(tree.body);
    },
    visitForInStatement: function(tree) {
      this.write_(FOR);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.initializer);
      this.writeSpace_();
      this.write_(IN);
      this.writeSpace_();
      this.visitAny(tree.collection);
      this.write_(CLOSE_PAREN);
      this.visitAnyBlockOrIndent_(tree.body);
    },
    visitForStatement: function(tree) {
      this.write_(FOR);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.initializer);
      this.write_(SEMI_COLON);
      this.writeSpace_();
      this.visitAny(tree.condition);
      this.write_(SEMI_COLON);
      this.writeSpace_();
      this.visitAny(tree.increment);
      this.write_(CLOSE_PAREN);
      this.visitAnyBlockOrIndent_(tree.body);
    },
    visitFormalParameterList: function(tree) {
      var first = true;
      for (var i = 0; i < tree.parameters.length; i++) {
        var parameter = tree.parameters[i];
        if (first) {
          first = false;
        } else {
          this.write_(COMMA);
          this.writeSpace_();
        }
        this.visitAny(parameter);
      }
    },
    visitFormalParameter: function(tree) {
      this.writeAnnotations_(tree.annotations, false);
      this.currentParameterTypeAnnotation_ = tree.typeAnnotation;
      this.visitAny(tree.parameter);
      this.currentParameterTypeAnnotation_ = null;
    },
    visitForwardDefaultExport: function(tree) {
      this.writeToken_(tree.name);
    },
    visitFunctionBody: function(tree) {
      this.writeOpenCurly_();
      this.writelnList_(tree.statements, null);
      this.writeCloseCurly_();
    },
    visitFunctionDeclaration: function(tree) {
      this.visitFunction_(tree);
    },
    visitFunctionExpression: function(tree) {
      this.visitFunction_(tree);
    },
    visitFunction_: function(tree) {
      this.writeAnnotations_(tree.annotations);
      if (tree.isAsyncGenerator()) {
        this.write_(ASYNC);
      }
      if (tree.isAsyncFunction())
        this.writeToken_(tree.functionKind);
      this.write_(FUNCTION);
      if (tree.isAsyncGenerator()) {
        this.write_(STAR);
      }
      if (tree.isGenerator())
        this.writeToken_(tree.functionKind);
      if (tree.name) {
        this.writeSpace_();
        this.visitAny(tree.name);
      }
      this.write_(OPEN_PAREN);
      this.visitAny(tree.parameterList);
      this.write_(CLOSE_PAREN);
      this.writeTypeAnnotation_(tree.typeAnnotation);
      this.writeSpace_();
      this.visitAny(tree.body);
    },
    visitFunctionType: function(tree) {
      if (tree.typeParameters !== null) {
        this.visitAny(tree.typeParameters);
      }
      this.write_(OPEN_PAREN);
      this.visitAny(tree.parameterList);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
      this.write_(ARROW);
      this.writeSpace_();
      this.visitAny(tree.returnType);
    },
    visitGeneratorComprehension: function(tree) {
      this.write_(OPEN_PAREN);
      this.visitList(tree.comprehensionList);
      this.visitAny(tree.expression);
      this.write_(CLOSE_PAREN);
    },
    visitGetAccessor: function(tree) {
      this.writeAnnotations_(tree.annotations);
      if (tree.isStatic) {
        this.write_(STATIC);
        this.writeSpace_();
      }
      this.write_(GET);
      this.writeSpace_();
      this.visitAny(tree.name);
      this.write_(OPEN_PAREN);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
      this.writeTypeAnnotation_(tree.typeAnnotation);
      this.visitAny(tree.body);
    },
    visitIdentifierExpression: function(tree) {
      this.writeToken_(tree.identifierToken);
    },
    visitIfStatement: function(tree) {
      this.write_(IF);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.condition);
      this.write_(CLOSE_PAREN);
      this.visitAnyBlockOrIndent_(tree.ifClause);
      if (tree.elseClause) {
        if (tree.ifClause.type === BLOCK)
          this.writeSpace_();
        this.write_(ELSE);
        if (tree.elseClause.type === IF_STATEMENT) {
          this.writeSpace_();
          this.visitAny(tree.elseClause);
        } else {
          this.visitAnyBlockOrIndent_(tree.elseClause);
        }
      }
    },
    visitIndexSignature: function(tree) {
      this.write_(OPEN_SQUARE);
      this.writeToken_(tree.name);
      this.write_(COLON);
      this.writeSpace_();
      this.visitAny(tree.indexType);
      this.write_(CLOSE_SQUARE);
      this.writeTypeAnnotation_(tree.typeAnnotation);
      this.write_(SEMI_COLON);
    },
    visitInterfaceDeclaration: function(tree) {
      this.write_(INTERFACE);
      this.writeSpace_();
      this.writeToken_(tree.name);
      if (tree.typeParameters) {
        this.visitAny(tree.typeParameters);
      }
      if (tree.extendsClause.length > 0) {
        this.writeSpace_();
        this.write_(EXTENDS);
        this.writeSpace_();
        this.writeList_(tree.extendsClause, COMMA, false);
      }
      this.writeSpace_();
      this.visitAny(tree.objectType);
    },
    visitAnyBlockOrIndent_: function(tree) {
      if (tree.type === BLOCK) {
        this.writeSpace_();
        this.visitAny(tree);
      } else {
        this.visitAnyIndented_(tree);
      }
    },
    visitAnyIndented_: function(tree) {
      var indent = arguments[1] !== (void 0) ? arguments[1] : 1;
      if (this.prettyPrint_) {
        this.indentDepth_ += indent;
        this.writeln_();
      }
      this.visitAny(tree);
      if (this.prettyPrint_) {
        this.indentDepth_ -= indent;
        this.writeln_();
      }
    },
    visitImportClausePair: function(tree) {
      this.visitAny(tree.first);
      this.write_(COMMA);
      this.writeSpace_();
      this.visitAny(tree.second);
    },
    visitImportDeclaration: function(tree) {
      this.write_(IMPORT);
      this.writeSpace_();
      if (tree.importClause) {
        this.visitAny(tree.importClause);
        this.writeSpace_();
        this.write_(FROM);
        this.writeSpace_();
      }
      this.visitAny(tree.moduleSpecifier);
      this.write_(SEMI_COLON);
    },
    visitImportSpecifier: function(tree) {
      if (tree.name) {
        this.writeToken_(tree.name);
        this.writeSpace_();
        this.write_(AS);
        this.writeSpace_();
      }
      this.visitAny(tree.binding);
    },
    visitImportSpecifierSet: function(tree) {
      if (tree.specifiers.type === STAR) {
        this.write_(STAR);
      } else {
        this.writeOpenCurly_();
        this.writelnList_(tree.specifiers, COMMA);
        this.writeCloseCurly_();
      }
    },
    visitImportTypeClause: function(tree) {
      this.write_(TYPE);
      this.writeSpace_();
      this.visitAny(tree.clause);
    },
    visitJsxAttribute: function(tree) {
      this.writeToken_(tree.name);
      if (tree.value !== null) {
        this.write_(EQUAL);
        this.visitAny(tree.value);
      }
    },
    visitJsxElement: function(tree) {
      this.write_(OPEN_ANGLE);
      this.visitAny(tree.name);
      for (var i = 0; i < tree.attributes.length; i++) {
        this.writeSpace_();
        this.visitAny(tree.attributes[i]);
      }
      if (tree.children.length === 0) {
        this.write_(SLASH);
        this.write_(CLOSE_ANGLE);
      } else {
        this.write_(CLOSE_ANGLE);
        this.visitList(tree.children);
        this.write_(OPEN_ANGLE);
        this.write_(SLASH);
        this.lastCode_ = -1;
        this.visitAny(tree.name);
        this.write_(CLOSE_ANGLE);
      }
    },
    visitJsxElementName: function(tree) {
      for (var i = 0; i < tree.names.length; i++) {
        if (i > 0) {
          this.write_(PERIOD);
        }
        this.writeToken_(tree.names[i]);
      }
    },
    visitJsxPlaceholder: function(tree) {
      this.write_(OPEN_CURLY);
      if (tree.expression !== null) {
        this.visitAny(tree.expression);
      }
      this.write_(CLOSE_CURLY);
    },
    visitJsxSpreadAttribute: function(tree) {
      this.write_(OPEN_CURLY);
      this.write_(DOT_DOT_DOT);
      this.visitAny(tree.expression);
      this.write_(CLOSE_CURLY);
    },
    visitJsxText: function(tree) {
      this.writeToken_(tree.value);
    },
    visitLabelledStatement: function(tree) {
      this.writeToken_(tree.name);
      this.write_(COLON);
      this.writeSpace_();
      this.visitAny(tree.statement);
    },
    visitLiteralExpression: function(tree) {
      this.writeToken_(tree.literalToken);
    },
    visitLiteralPropertyName: function(tree) {
      this.writeToken_(tree.literalToken);
    },
    visitMemberExpression: function(tree) {
      this.visitAny(tree.operand);
      if (tree.operand.type === LITERAL_EXPRESSION && tree.operand.literalToken.type === NUMBER) {
        if (!/\.|e|E/.test(tree.operand.literalToken.value))
          this.writeRequiredSpace_();
      }
      this.write_(PERIOD);
      this.writeToken_(tree.memberName);
    },
    visitMemberLookupExpression: function(tree) {
      this.visitAny(tree.operand);
      this.write_(OPEN_SQUARE);
      this.visitAny(tree.memberExpression);
      this.write_(CLOSE_SQUARE);
    },
    visitMethodSignature: function(tree) {
      this.visitAny(tree.name);
      if (tree.optional) {
        this.write_(QUESTION);
      }
      this.visitAny(tree.callSignature);
      this.write_(SEMI_COLON);
    },
    visitSyntaxErrorTree: function(tree) {
      this.write_('(function() {' + ("throw SyntaxError(" + JSON.stringify(tree.message) + ");") + '})()');
    },
    visitModule: function(tree) {
      this.writelnList_(tree.scriptItemList, null);
    },
    visitModuleSpecifier: function(tree) {
      this.writeToken_(tree.token);
    },
    visitNewExpression: function(tree) {
      this.write_(NEW);
      this.writeSpace_();
      this.visitAny(tree.operand);
      this.visitAny(tree.args);
    },
    visitObjectLiteral: function(tree) {
      this.writeOpenCurly_();
      if (tree.propertyNameAndValues.length > 1)
        this.writeln_();
      this.writelnList_(tree.propertyNameAndValues, COMMA);
      if (tree.propertyNameAndValues.length > 1)
        this.writeln_();
      this.writeCloseCurly_();
    },
    visitObjectPattern: function(tree) {
      this.writeOpenCurly_();
      this.writelnList_(tree.fields, COMMA);
      this.writeCloseCurly_();
    },
    visitObjectPatternField: function(tree) {
      this.visitAny(tree.name);
      if (tree.element !== null) {
        this.write_(COLON);
        this.writeSpace_();
        this.visitAny(tree.element);
      }
    },
    visitObjectType: function(tree) {
      this.writeOpenCurly_();
      this.writelnList_(tree.typeMembers, null);
      this.writeCloseCurly_();
    },
    visitParenExpression: function(tree) {
      this.write_(OPEN_PAREN);
      $__superGet(this, ParseTreeWriter.prototype, "visitParenExpression").call(this, tree);
      this.write_(CLOSE_PAREN);
    },
    visitPostfixExpression: function(tree) {
      this.visitAny(tree.operand);
      if (tree.operand.type === POSTFIX_EXPRESSION && tree.operand.operator.type === tree.operator.type) {
        this.writeRequiredSpace_();
      }
      this.writeToken_(tree.operator);
    },
    visitPredefinedType: function(tree) {
      this.writeToken_(tree.typeToken);
    },
    visitScript: function(tree) {
      this.writelnList_(tree.scriptItemList, null);
    },
    visitMethod: function(tree) {
      this.writeAnnotations_(tree.annotations);
      if (tree.isStatic) {
        this.write_(STATIC);
        this.writeSpace_();
      }
      if (tree.isAsyncFunction() || tree.isAsyncGenerator())
        this.write_(ASYNC);
      if (tree.isGenerator() || tree.isAsyncGenerator())
        this.write_(STAR);
      if (tree.isAsyncGenerator())
        this.writeSpace_();
      this.visitAny(tree.name);
      this.write_(OPEN_PAREN);
      this.visitAny(tree.parameterList);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
      this.writeTypeAnnotation_(tree.typeAnnotation);
      this.visitAny(tree.body);
    },
    visitPropertyNameAssignment: function(tree) {
      this.visitAny(tree.name);
      this.write_(COLON);
      this.writeSpace_();
      this.visitAny(tree.value);
    },
    visitPropertyNameShorthand: function(tree) {
      this.writeToken_(tree.name);
    },
    visitPropertyVariableDeclaration: function(tree) {
      this.writeAnnotations_(tree.annotations);
      if (tree.isStatic) {
        this.write_(STATIC);
        this.writeSpace_();
      }
      this.visitAny(tree.name);
      this.writeTypeAnnotation_(tree.typeAnnotation);
      if (tree.initalizer) {
        this.writeSpace_();
        this.write_(EQUAL);
        this.writeSpace_();
        this.visitAny(tree.initializer);
      }
      this.write_(SEMI_COLON);
    },
    visitPropertySignature: function(tree) {
      this.visitAny(tree.name);
      if (tree.optional) {
        this.write_(QUESTION);
      }
      this.writeTypeAnnotation_(tree.typeAnnotation);
      this.write_(SEMI_COLON);
    },
    visitTemplateLiteralExpression: function(tree) {
      if (tree.operand) {
        this.visitAny(tree.operand);
        this.writeSpace_();
      }
      this.writeRaw_(BACK_QUOTE);
      this.visitList(tree.elements);
      this.writeRaw_(BACK_QUOTE);
    },
    visitTemplateLiteralPortion: function(tree) {
      this.writeToken_(tree.value);
    },
    visitTemplateSubstitution: function(tree) {
      this.writeRaw_('$');
      this.writeRaw_(OPEN_CURLY);
      this.visitAny(tree.expression);
      this.writeRaw_(CLOSE_CURLY);
    },
    visitReturnStatement: function(tree) {
      this.write_(RETURN);
      if (tree.expression) {
        this.writeSpace_(tree.expression);
        this.visitAny(tree.expression);
      }
      this.write_(SEMI_COLON);
    },
    visitRestParameter: function(tree) {
      this.write_(DOT_DOT_DOT);
      this.visitAny(tree.identifier);
    },
    visitSetAccessor: function(tree) {
      this.writeAnnotations_(tree.annotations);
      if (tree.isStatic) {
        this.write_(STATIC);
        this.writeSpace_();
      }
      this.write_(SET);
      this.writeSpace_();
      this.visitAny(tree.name);
      this.write_(OPEN_PAREN);
      this.visitAny(tree.parameterList);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
      this.visitAny(tree.body);
    },
    visitSpreadExpression: function(tree) {
      this.write_(DOT_DOT_DOT);
      this.visitAny(tree.expression);
    },
    visitSpreadPatternElement: function(tree) {
      this.write_(DOT_DOT_DOT);
      this.visitAny(tree.lvalue);
    },
    visitStateMachine: function(tree) {
      throw new Error('State machines cannot be converted to source');
    },
    visitSuperExpression: function(tree) {
      this.write_(SUPER);
    },
    visitSwitchStatement: function(tree) {
      this.write_(SWITCH);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.expression);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
      this.writeOpenCurly_();
      this.writelnList_(tree.caseClauses, null);
      this.writeCloseCurly_();
    },
    visitThisExpression: function(tree) {
      this.write_(THIS);
    },
    visitThrowStatement: function(tree) {
      this.write_(THROW);
      this.writeSpace_();
      this.visitAny(tree.value);
      this.write_(SEMI_COLON);
    },
    visitTryStatement: function(tree) {
      this.write_(TRY);
      this.writeSpace_();
      this.visitAny(tree.body);
      if (tree.catchBlock) {
        this.writeSpace_();
        this.visitAny(tree.catchBlock);
      }
      if (tree.finallyBlock) {
        this.writeSpace_();
        this.visitAny(tree.finallyBlock);
      }
    },
    visitTypeAliasDeclaration: function(tree) {
      this.write_(TYPE);
      this.writeRequiredSpace_();
      this.writeToken_(tree.name);
      this.writeSpace_();
      this.write_(EQUAL);
      this.writeSpace_();
      this.visitAny(tree.value);
      this.write_(SEMI_COLON);
    },
    visitTypeArguments: function(tree) {
      this.write_(OPEN_ANGLE);
      var args = tree.args;
      this.visitAny(args[0]);
      for (var i = 1; i < args.length; i++) {
        this.write_(COMMA);
        this.writeSpace_();
        this.visitAny(args[i]);
      }
      this.write_(CLOSE_ANGLE);
    },
    visitTypeName: function(tree) {
      if (tree.moduleName) {
        this.visitAny(tree.moduleName);
        this.write_(PERIOD);
      }
      this.writeToken_(tree.name);
    },
    visitTypeParameter: function(tree) {
      this.writeToken_(tree.identifierToken);
      if (tree.extendsType) {
        this.writeSpace_();
        this.write_(EXTENDS);
        this.writeSpace_();
        this.visitAny(tree.extendsType);
      }
    },
    visitTypeParameters: function(tree) {
      this.write_(OPEN_ANGLE);
      this.writeList_(tree.parameters, COMMA, false);
      this.write_(CLOSE_ANGLE);
    },
    visitUnaryExpression: function(tree) {
      var op = tree.operator;
      this.writeToken_(op);
      var operand = tree.operand;
      if (operand.type === UNARY_EXPRESSION && requiresSpaceBetween(op.type, operand.operator.type)) {
        this.writeRequiredSpace_();
      }
      this.visitAny(operand);
    },
    visitUnionType: function(tree) {
      this.visitAny(tree.types[0]);
      for (var i = 1; i < tree.types.length; i++) {
        this.writeSpace_();
        this.write_(BAR);
        this.writeSpace_();
        this.visitAny(tree.types[i]);
      }
    },
    visitVariableDeclarationList: function(tree) {
      this.write_(tree.declarationType);
      this.writeSpace_();
      this.writeList_(tree.declarations, COMMA, true, 2);
    },
    visitVariableDeclaration: function(tree) {
      this.visitAny(tree.lvalue);
      this.writeTypeAnnotation_(tree.typeAnnotation);
      if (tree.initializer !== null) {
        this.writeSpace_();
        this.write_(EQUAL);
        this.writeSpace_();
        this.visitAny(tree.initializer);
      }
    },
    visitVariableStatement: function(tree) {
      $__superGet(this, ParseTreeWriter.prototype, "visitVariableStatement").call(this, tree);
      this.write_(SEMI_COLON);
    },
    visitWhileStatement: function(tree) {
      this.write_(WHILE);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.condition);
      this.write_(CLOSE_PAREN);
      this.visitAnyBlockOrIndent_(tree.body);
    },
    visitWithStatement: function(tree) {
      this.write_(WITH);
      this.writeSpace_();
      this.write_(OPEN_PAREN);
      this.visitAny(tree.expression);
      this.write_(CLOSE_PAREN);
      this.writeSpace_();
      this.visitAny(tree.body);
    },
    visitYieldExpression: function(tree) {
      this.write_(YIELD);
      if (tree.isYieldFor)
        this.write_(STAR);
      if (tree.expression) {
        this.writeSpace_();
        this.visitAny(tree.expression);
      }
    },
    writeCurrentln_: function() {
      this.result_ += this.currentLine_ + NEW_LINE;
    },
    writeln_: function() {
      if (this.currentLine_)
        this.writeCurrentln_();
      this.currentLine_ = '';
      this.lastCode_ = -1;
    },
    writelnList_: function(list, delimiter) {
      if (delimiter !== null) {
        this.writeList_(list, delimiter, true);
      } else {
        if (list.length > 0)
          this.writeln_();
        this.writeList_(list, '', true);
        if (list.length > 0)
          this.writeln_();
      }
    },
    writeList_: function(list, delimiter, writeNewLine) {
      var indent = arguments[3] !== (void 0) ? arguments[3] : 0;
      var first = true;
      for (var i = 0; i < list.length; i++) {
        if (first) {
          first = false;
        } else {
          if (delimiter !== '') {
            this.write_(delimiter);
            if (!writeNewLine)
              this.writeSpace_();
          }
          if (writeNewLine) {
            if (i === 1)
              this.indentDepth_ += indent;
            this.writeln_();
          }
        }
        this.visitAny(list[i]);
      }
      if (writeNewLine && list.length > 1)
        this.indentDepth_ -= indent;
    },
    writeRaw_: function(value) {
      this.currentLine_ += value;
      this.lastCode_ = value.charCodeAt(value.length - 1);
    },
    writeToken_: function(token) {
      this.write_(token.toString());
    },
    write_: function(value) {
      if (this.prettyPrint_ && this.currentLine_.length === 0) {
        for (var i = 0,
            indent = this.indentDepth_; i < indent; i++) {
          this.writeRaw_('  ');
        }
      }
      if (this.needsSpace_(value)) {
        this.writeRaw_(' ');
      }
      this.writeRaw_(value);
    },
    writeCloseCurly_: function() {
      this.indentDepth_--;
      this.write_(CLOSE_CURLY);
    },
    writeOpenCurly_: function() {
      this.write_(OPEN_CURLY);
      this.indentDepth_++;
    },
    writeSpace_: function() {
      if (this.prettyPrint_ && !isWhitespace(this.lastCode_)) {
        this.writeRaw_(' ');
      }
    },
    writeRequiredSpace_: function() {
      if (!isWhitespace(this.lastCode_)) {
        this.writeRaw_(' ');
      }
    },
    writeTypeAnnotation_: function(typeAnnotation) {
      if (typeAnnotation !== null) {
        this.write_(COLON);
        this.writeSpace_();
        this.visitAny(typeAnnotation);
      }
    },
    writeAnnotations_: function(annotations) {
      var writeNewLine = arguments[1] !== (void 0) ? arguments[1] : this.prettyPrint_;
      if (annotations.length > 0) {
        this.writeList_(annotations, '', writeNewLine);
        if (writeNewLine)
          this.writeln_();
      }
    },
    needsSpace_: function(token) {
      var lastCode = this.lastCode_;
      if (isWhitespace(lastCode))
        return false;
      var firstCode = token.toString().charCodeAt(0);
      return isIdentifierPart(firstCode) && (isIdentifierPart(lastCode) || lastCode === 47);
    }
  }, {}, $__super);
}(ParseTreeVisitor);
function requiresSpaceBetween(first, second) {
  return (first === MINUS || first === MINUS_MINUS) && (second === MINUS || second === MINUS_MINUS) || (first === PLUS || first === PLUS_PLUS) && (second === PLUS || second === PLUS_PLUS);
}
