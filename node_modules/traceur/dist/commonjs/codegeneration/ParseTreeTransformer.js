"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ParseTreeTransformer: {
    enumerable: true,
    get: function() {
      return ParseTreeTransformer;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__4 = require("../syntax/trees/ParseTrees.js"),
    Annotation = $__4.Annotation,
    AnonBlock = $__4.AnonBlock,
    ArgumentList = $__4.ArgumentList,
    ArrayComprehension = $__4.ArrayComprehension,
    ArrayLiteral = $__4.ArrayLiteral,
    ArrayPattern = $__4.ArrayPattern,
    ArrayType = $__4.ArrayType,
    ArrowFunction = $__4.ArrowFunction,
    AssignmentElement = $__4.AssignmentElement,
    AwaitExpression = $__4.AwaitExpression,
    BinaryExpression = $__4.BinaryExpression,
    BindingElement = $__4.BindingElement,
    BindingIdentifier = $__4.BindingIdentifier,
    Block = $__4.Block,
    BreakStatement = $__4.BreakStatement,
    CallExpression = $__4.CallExpression,
    CallSignature = $__4.CallSignature,
    CaseClause = $__4.CaseClause,
    Catch = $__4.Catch,
    ClassDeclaration = $__4.ClassDeclaration,
    ClassExpression = $__4.ClassExpression,
    CommaExpression = $__4.CommaExpression,
    ComprehensionFor = $__4.ComprehensionFor,
    ComprehensionIf = $__4.ComprehensionIf,
    ComputedPropertyName = $__4.ComputedPropertyName,
    ConditionalExpression = $__4.ConditionalExpression,
    ConstructSignature = $__4.ConstructSignature,
    ConstructorType = $__4.ConstructorType,
    ContinueStatement = $__4.ContinueStatement,
    CoverFormals = $__4.CoverFormals,
    CoverInitializedName = $__4.CoverInitializedName,
    DebuggerStatement = $__4.DebuggerStatement,
    DefaultClause = $__4.DefaultClause,
    DoWhileStatement = $__4.DoWhileStatement,
    EmptyStatement = $__4.EmptyStatement,
    ExportDeclaration = $__4.ExportDeclaration,
    ExportDefault = $__4.ExportDefault,
    ExportSpecifier = $__4.ExportSpecifier,
    ExportSpecifierSet = $__4.ExportSpecifierSet,
    ExportStar = $__4.ExportStar,
    ExpressionStatement = $__4.ExpressionStatement,
    Finally = $__4.Finally,
    ForInStatement = $__4.ForInStatement,
    ForOfStatement = $__4.ForOfStatement,
    ForOnStatement = $__4.ForOnStatement,
    ForStatement = $__4.ForStatement,
    FormalParameter = $__4.FormalParameter,
    FormalParameterList = $__4.FormalParameterList,
    ForwardDefaultExport = $__4.ForwardDefaultExport,
    FunctionBody = $__4.FunctionBody,
    FunctionDeclaration = $__4.FunctionDeclaration,
    FunctionExpression = $__4.FunctionExpression,
    FunctionType = $__4.FunctionType,
    GeneratorComprehension = $__4.GeneratorComprehension,
    GetAccessor = $__4.GetAccessor,
    IdentifierExpression = $__4.IdentifierExpression,
    IfStatement = $__4.IfStatement,
    ImportedBinding = $__4.ImportedBinding,
    ImportClausePair = $__4.ImportClausePair,
    ImportDeclaration = $__4.ImportDeclaration,
    ImportSpecifier = $__4.ImportSpecifier,
    ImportSpecifierSet = $__4.ImportSpecifierSet,
    ImportTypeClause = $__4.ImportTypeClause,
    IndexSignature = $__4.IndexSignature,
    InterfaceDeclaration = $__4.InterfaceDeclaration,
    JsxAttribute = $__4.JsxAttribute,
    JsxElement = $__4.JsxElement,
    JsxElementName = $__4.JsxElementName,
    JsxPlaceholder = $__4.JsxPlaceholder,
    JsxSpreadAttribute = $__4.JsxSpreadAttribute,
    JsxText = $__4.JsxText,
    LabelledStatement = $__4.LabelledStatement,
    LiteralExpression = $__4.LiteralExpression,
    LiteralPropertyName = $__4.LiteralPropertyName,
    MemberExpression = $__4.MemberExpression,
    MemberLookupExpression = $__4.MemberLookupExpression,
    Method = $__4.Method,
    MethodSignature = $__4.MethodSignature,
    Module = $__4.Module,
    ModuleSpecifier = $__4.ModuleSpecifier,
    NameSpaceExport = $__4.NameSpaceExport,
    NameSpaceImport = $__4.NameSpaceImport,
    NamedExport = $__4.NamedExport,
    NewExpression = $__4.NewExpression,
    ObjectLiteral = $__4.ObjectLiteral,
    ObjectPattern = $__4.ObjectPattern,
    ObjectPatternField = $__4.ObjectPatternField,
    ObjectType = $__4.ObjectType,
    ParenExpression = $__4.ParenExpression,
    PostfixExpression = $__4.PostfixExpression,
    PredefinedType = $__4.PredefinedType,
    Script = $__4.Script,
    PropertyNameAssignment = $__4.PropertyNameAssignment,
    PropertyNameShorthand = $__4.PropertyNameShorthand,
    PropertyVariableDeclaration = $__4.PropertyVariableDeclaration,
    PropertySignature = $__4.PropertySignature,
    RestParameter = $__4.RestParameter,
    ReturnStatement = $__4.ReturnStatement,
    SetAccessor = $__4.SetAccessor,
    SpreadExpression = $__4.SpreadExpression,
    SpreadPatternElement = $__4.SpreadPatternElement,
    SuperExpression = $__4.SuperExpression,
    SwitchStatement = $__4.SwitchStatement,
    SyntaxErrorTree = $__4.SyntaxErrorTree,
    TemplateLiteralExpression = $__4.TemplateLiteralExpression,
    TemplateLiteralPortion = $__4.TemplateLiteralPortion,
    TemplateSubstitution = $__4.TemplateSubstitution,
    ThisExpression = $__4.ThisExpression,
    ThrowStatement = $__4.ThrowStatement,
    TryStatement = $__4.TryStatement,
    TypeAliasDeclaration = $__4.TypeAliasDeclaration,
    TypeArguments = $__4.TypeArguments,
    TypeName = $__4.TypeName,
    TypeParameter = $__4.TypeParameter,
    TypeParameters = $__4.TypeParameters,
    TypeReference = $__4.TypeReference,
    UnaryExpression = $__4.UnaryExpression,
    UnionType = $__4.UnionType,
    VariableDeclaration = $__4.VariableDeclaration,
    VariableDeclarationList = $__4.VariableDeclarationList,
    VariableStatement = $__4.VariableStatement,
    WhileStatement = $__4.WhileStatement,
    WithStatement = $__4.WithStatement,
    YieldExpression = $__4.YieldExpression;
var ParseTreeTransformer = function() {
  function ParseTreeTransformer() {}
  return ($__createClass)(ParseTreeTransformer, {
    transformAny: function(tree) {
      return tree === null ? null : tree.transform(this);
    },
    transformList: function(list) {
      var $__1;
      var builder = null;
      for (var index = 0; index < list.length; index++) {
        var element = list[index];
        var transformed = this.transformAny(element);
        if (builder != null || element != transformed) {
          if (builder === null) {
            builder = list.slice(0, index);
          }
          if (transformed instanceof AnonBlock)
            ($__1 = builder).push.apply($__1, $__spread(transformed.statements));
          else
            builder.push(transformed);
        }
      }
      return builder || list;
    },
    transformStateMachine: function(tree) {
      throw Error('State machines should not live outside of the GeneratorTransformer.');
    },
    transformToBlockOrStatement: function(tree) {
      var transformed = this.transformAny(tree);
      if (transformed instanceof AnonBlock) {
        return new Block(transformed.location, transformed.statements);
      }
      return transformed;
    },
    transformAnnotation: function(tree) {
      var name = this.transformAny(tree.name);
      var args = this.transformAny(tree.args);
      if (name === tree.name && args === tree.args) {
        return tree;
      }
      return new Annotation(tree.location, name, args);
    },
    transformAnonBlock: function(tree) {
      var statements = this.transformList(tree.statements);
      if (statements === tree.statements) {
        return tree;
      }
      return new AnonBlock(tree.location, statements);
    },
    transformArgumentList: function(tree) {
      var args = this.transformList(tree.args);
      if (args === tree.args) {
        return tree;
      }
      return new ArgumentList(tree.location, args);
    },
    transformArrayComprehension: function(tree) {
      var comprehensionList = this.transformList(tree.comprehensionList);
      var expression = this.transformAny(tree.expression);
      if (comprehensionList === tree.comprehensionList && expression === tree.expression) {
        return tree;
      }
      return new ArrayComprehension(tree.location, comprehensionList, expression);
    },
    transformArrayLiteral: function(tree) {
      var elements = this.transformList(tree.elements);
      if (elements === tree.elements) {
        return tree;
      }
      return new ArrayLiteral(tree.location, elements);
    },
    transformArrayPattern: function(tree) {
      var elements = this.transformList(tree.elements);
      if (elements === tree.elements) {
        return tree;
      }
      return new ArrayPattern(tree.location, elements);
    },
    transformArrayType: function(tree) {
      var elementType = this.transformAny(tree.elementType);
      if (elementType === tree.elementType) {
        return tree;
      }
      return new ArrayType(tree.location, elementType);
    },
    transformArrowFunction: function(tree) {
      var parameterList = this.transformAny(tree.parameterList);
      var body = this.transformAny(tree.body);
      if (parameterList === tree.parameterList && body === tree.body) {
        return tree;
      }
      return new ArrowFunction(tree.location, tree.functionKind, parameterList, body);
    },
    transformAssignmentElement: function(tree) {
      var assignment = this.transformAny(tree.assignment);
      var initializer = this.transformAny(tree.initializer);
      if (assignment === tree.assignment && initializer === tree.initializer) {
        return tree;
      }
      return new AssignmentElement(tree.location, assignment, initializer);
    },
    transformAwaitExpression: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new AwaitExpression(tree.location, expression);
    },
    transformBinaryExpression: function(tree) {
      var left = this.transformAny(tree.left);
      var right = this.transformAny(tree.right);
      if (left === tree.left && right === tree.right) {
        return tree;
      }
      return new BinaryExpression(tree.location, left, tree.operator, right);
    },
    transformBindingElement: function(tree) {
      var binding = this.transformAny(tree.binding);
      var initializer = this.transformAny(tree.initializer);
      if (binding === tree.binding && initializer === tree.initializer) {
        return tree;
      }
      return new BindingElement(tree.location, binding, initializer);
    },
    transformBindingIdentifier: function(tree) {
      return tree;
    },
    transformBlock: function(tree) {
      var statements = this.transformList(tree.statements);
      if (statements === tree.statements) {
        return tree;
      }
      return new Block(tree.location, statements);
    },
    transformBreakStatement: function(tree) {
      return tree;
    },
    transformCallExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      var args = this.transformAny(tree.args);
      if (operand === tree.operand && args === tree.args) {
        return tree;
      }
      return new CallExpression(tree.location, operand, args);
    },
    transformCallSignature: function(tree) {
      var typeParameters = this.transformAny(tree.typeParameters);
      var parameterList = this.transformAny(tree.parameterList);
      var returnType = this.transformAny(tree.returnType);
      if (typeParameters === tree.typeParameters && parameterList === tree.parameterList && returnType === tree.returnType) {
        return tree;
      }
      return new CallSignature(tree.location, typeParameters, parameterList, returnType);
    },
    transformCaseClause: function(tree) {
      var expression = this.transformAny(tree.expression);
      var statements = this.transformList(tree.statements);
      if (expression === tree.expression && statements === tree.statements) {
        return tree;
      }
      return new CaseClause(tree.location, expression, statements);
    },
    transformCatch: function(tree) {
      var binding = this.transformAny(tree.binding);
      var catchBody = this.transformAny(tree.catchBody);
      if (binding === tree.binding && catchBody === tree.catchBody) {
        return tree;
      }
      return new Catch(tree.location, binding, catchBody);
    },
    transformClassDeclaration: function(tree) {
      var name = this.transformAny(tree.name);
      var superClass = this.transformAny(tree.superClass);
      var elements = this.transformList(tree.elements);
      var annotations = this.transformList(tree.annotations);
      var typeParameters = this.transformAny(tree.typeParameters);
      if (name === tree.name && superClass === tree.superClass && elements === tree.elements && annotations === tree.annotations && typeParameters === tree.typeParameters) {
        return tree;
      }
      return new ClassDeclaration(tree.location, name, superClass, elements, annotations, typeParameters);
    },
    transformClassExpression: function(tree) {
      var name = this.transformAny(tree.name);
      var superClass = this.transformAny(tree.superClass);
      var elements = this.transformList(tree.elements);
      var annotations = this.transformList(tree.annotations);
      var typeParameters = this.transformAny(tree.typeParameters);
      if (name === tree.name && superClass === tree.superClass && elements === tree.elements && annotations === tree.annotations && typeParameters === tree.typeParameters) {
        return tree;
      }
      return new ClassExpression(tree.location, name, superClass, elements, annotations, typeParameters);
    },
    transformCommaExpression: function(tree) {
      var expressions = this.transformList(tree.expressions);
      if (expressions === tree.expressions) {
        return tree;
      }
      return new CommaExpression(tree.location, expressions);
    },
    transformComprehensionFor: function(tree) {
      var left = this.transformAny(tree.left);
      var iterator = this.transformAny(tree.iterator);
      if (left === tree.left && iterator === tree.iterator) {
        return tree;
      }
      return new ComprehensionFor(tree.location, left, iterator);
    },
    transformComprehensionIf: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new ComprehensionIf(tree.location, expression);
    },
    transformComputedPropertyName: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new ComputedPropertyName(tree.location, expression);
    },
    transformConditionalExpression: function(tree) {
      var condition = this.transformAny(tree.condition);
      var left = this.transformAny(tree.left);
      var right = this.transformAny(tree.right);
      if (condition === tree.condition && left === tree.left && right === tree.right) {
        return tree;
      }
      return new ConditionalExpression(tree.location, condition, left, right);
    },
    transformConstructSignature: function(tree) {
      var typeParameters = this.transformAny(tree.typeParameters);
      var parameterList = this.transformAny(tree.parameterList);
      var returnType = this.transformAny(tree.returnType);
      if (typeParameters === tree.typeParameters && parameterList === tree.parameterList && returnType === tree.returnType) {
        return tree;
      }
      return new ConstructSignature(tree.location, typeParameters, parameterList, returnType);
    },
    transformConstructorType: function(tree) {
      var typeParameters = this.transformAny(tree.typeParameters);
      var parameterList = this.transformAny(tree.parameterList);
      var returnType = this.transformAny(tree.returnType);
      if (typeParameters === tree.typeParameters && parameterList === tree.parameterList && returnType === tree.returnType) {
        return tree;
      }
      return new ConstructorType(tree.location, typeParameters, parameterList, returnType);
    },
    transformContinueStatement: function(tree) {
      return tree;
    },
    transformCoverFormals: function(tree) {
      var expressions = this.transformList(tree.expressions);
      if (expressions === tree.expressions) {
        return tree;
      }
      return new CoverFormals(tree.location, expressions);
    },
    transformCoverInitializedName: function(tree) {
      var initializer = this.transformAny(tree.initializer);
      if (initializer === tree.initializer) {
        return tree;
      }
      return new CoverInitializedName(tree.location, tree.name, tree.equalToken, initializer);
    },
    transformDebuggerStatement: function(tree) {
      return tree;
    },
    transformDefaultClause: function(tree) {
      var statements = this.transformList(tree.statements);
      if (statements === tree.statements) {
        return tree;
      }
      return new DefaultClause(tree.location, statements);
    },
    transformDoWhileStatement: function(tree) {
      var body = this.transformToBlockOrStatement(tree.body);
      var condition = this.transformAny(tree.condition);
      if (body === tree.body && condition === tree.condition) {
        return tree;
      }
      return new DoWhileStatement(tree.location, body, condition);
    },
    transformEmptyStatement: function(tree) {
      return tree;
    },
    transformExportDeclaration: function(tree) {
      var declaration = this.transformAny(tree.declaration);
      var annotations = this.transformList(tree.annotations);
      if (declaration === tree.declaration && annotations === tree.annotations) {
        return tree;
      }
      return new ExportDeclaration(tree.location, declaration, annotations);
    },
    transformExportDefault: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new ExportDefault(tree.location, expression);
    },
    transformExportSpecifier: function(tree) {
      return tree;
    },
    transformExportSpecifierSet: function(tree) {
      var specifiers = this.transformList(tree.specifiers);
      if (specifiers === tree.specifiers) {
        return tree;
      }
      return new ExportSpecifierSet(tree.location, specifiers);
    },
    transformExportStar: function(tree) {
      return tree;
    },
    transformExpressionStatement: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new ExpressionStatement(tree.location, expression);
    },
    transformFinally: function(tree) {
      var block = this.transformAny(tree.block);
      if (block === tree.block) {
        return tree;
      }
      return new Finally(tree.location, block);
    },
    transformForInStatement: function(tree) {
      var initializer = this.transformAny(tree.initializer);
      var collection = this.transformAny(tree.collection);
      var body = this.transformToBlockOrStatement(tree.body);
      if (initializer === tree.initializer && collection === tree.collection && body === tree.body) {
        return tree;
      }
      return new ForInStatement(tree.location, initializer, collection, body);
    },
    transformForOfStatement: function(tree) {
      var initializer = this.transformAny(tree.initializer);
      var collection = this.transformAny(tree.collection);
      var body = this.transformToBlockOrStatement(tree.body);
      if (initializer === tree.initializer && collection === tree.collection && body === tree.body) {
        return tree;
      }
      return new ForOfStatement(tree.location, initializer, collection, body);
    },
    transformForOnStatement: function(tree) {
      var initializer = this.transformAny(tree.initializer);
      var observable = this.transformAny(tree.observable);
      var body = this.transformToBlockOrStatement(tree.body);
      if (initializer === tree.initializer && observable === tree.observable && body === tree.body) {
        return tree;
      }
      return new ForOnStatement(tree.location, initializer, observable, body);
    },
    transformForStatement: function(tree) {
      var initializer = this.transformAny(tree.initializer);
      var condition = this.transformAny(tree.condition);
      var increment = this.transformAny(tree.increment);
      var body = this.transformToBlockOrStatement(tree.body);
      if (initializer === tree.initializer && condition === tree.condition && increment === tree.increment && body === tree.body) {
        return tree;
      }
      return new ForStatement(tree.location, initializer, condition, increment, body);
    },
    transformFormalParameter: function(tree) {
      var parameter = this.transformAny(tree.parameter);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      if (parameter === tree.parameter && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations) {
        return tree;
      }
      return new FormalParameter(tree.location, parameter, typeAnnotation, annotations);
    },
    transformFormalParameterList: function(tree) {
      var parameters = this.transformList(tree.parameters);
      if (parameters === tree.parameters) {
        return tree;
      }
      return new FormalParameterList(tree.location, parameters);
    },
    transformForwardDefaultExport: function(tree) {
      return tree;
    },
    transformFunctionBody: function(tree) {
      var statements = this.transformList(tree.statements);
      if (statements === tree.statements) {
        return tree;
      }
      return new FunctionBody(tree.location, statements);
    },
    transformFunctionDeclaration: function(tree) {
      var name = this.transformAny(tree.name);
      var parameterList = this.transformAny(tree.parameterList);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var body = this.transformAny(tree.body);
      if (name === tree.name && parameterList === tree.parameterList && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
        return tree;
      }
      return new FunctionDeclaration(tree.location, name, tree.functionKind, parameterList, typeAnnotation, annotations, body);
    },
    transformFunctionExpression: function(tree) {
      var name = this.transformAny(tree.name);
      var parameterList = this.transformAny(tree.parameterList);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var body = this.transformAny(tree.body);
      if (name === tree.name && parameterList === tree.parameterList && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
        return tree;
      }
      return new FunctionExpression(tree.location, name, tree.functionKind, parameterList, typeAnnotation, annotations, body);
    },
    transformFunctionType: function(tree) {
      var typeParameters = this.transformAny(tree.typeParameters);
      var parameterList = this.transformAny(tree.parameterList);
      var returnType = this.transformAny(tree.returnType);
      if (typeParameters === tree.typeParameters && parameterList === tree.parameterList && returnType === tree.returnType) {
        return tree;
      }
      return new FunctionType(tree.location, typeParameters, parameterList, returnType);
    },
    transformGeneratorComprehension: function(tree) {
      var comprehensionList = this.transformList(tree.comprehensionList);
      var expression = this.transformAny(tree.expression);
      if (comprehensionList === tree.comprehensionList && expression === tree.expression) {
        return tree;
      }
      return new GeneratorComprehension(tree.location, comprehensionList, expression);
    },
    transformGetAccessor: function(tree) {
      var name = this.transformAny(tree.name);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var body = this.transformAny(tree.body);
      if (name === tree.name && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body) {
        return tree;
      }
      return new GetAccessor(tree.location, tree.isStatic, name, typeAnnotation, annotations, body);
    },
    transformIdentifierExpression: function(tree) {
      return tree;
    },
    transformIfStatement: function(tree) {
      var condition = this.transformAny(tree.condition);
      var ifClause = this.transformToBlockOrStatement(tree.ifClause);
      var elseClause = this.transformToBlockOrStatement(tree.elseClause);
      if (condition === tree.condition && ifClause === tree.ifClause && elseClause === tree.elseClause) {
        return tree;
      }
      return new IfStatement(tree.location, condition, ifClause, elseClause);
    },
    transformImportedBinding: function(tree) {
      var binding = this.transformAny(tree.binding);
      if (binding === tree.binding) {
        return tree;
      }
      return new ImportedBinding(tree.location, binding);
    },
    transformImportClausePair: function(tree) {
      var first = this.transformAny(tree.first);
      var second = this.transformAny(tree.second);
      if (first === tree.first && second === tree.second) {
        return tree;
      }
      return new ImportClausePair(tree.location, first, second);
    },
    transformImportDeclaration: function(tree) {
      var importClause = this.transformAny(tree.importClause);
      var moduleSpecifier = this.transformAny(tree.moduleSpecifier);
      if (importClause === tree.importClause && moduleSpecifier === tree.moduleSpecifier) {
        return tree;
      }
      return new ImportDeclaration(tree.location, importClause, moduleSpecifier);
    },
    transformImportSpecifier: function(tree) {
      var binding = this.transformAny(tree.binding);
      if (binding === tree.binding) {
        return tree;
      }
      return new ImportSpecifier(tree.location, binding, tree.name);
    },
    transformImportSpecifierSet: function(tree) {
      var specifiers = this.transformList(tree.specifiers);
      if (specifiers === tree.specifiers) {
        return tree;
      }
      return new ImportSpecifierSet(tree.location, specifiers);
    },
    transformImportTypeClause: function(tree) {
      var clause = this.transformAny(tree.clause);
      if (clause === tree.clause) {
        return tree;
      }
      return new ImportTypeClause(tree.location, clause);
    },
    transformIndexSignature: function(tree) {
      var indexType = this.transformAny(tree.indexType);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      if (indexType === tree.indexType && typeAnnotation === tree.typeAnnotation) {
        return tree;
      }
      return new IndexSignature(tree.location, tree.name, indexType, typeAnnotation);
    },
    transformInterfaceDeclaration: function(tree) {
      var typeParameters = this.transformAny(tree.typeParameters);
      var objectType = this.transformAny(tree.objectType);
      if (typeParameters === tree.typeParameters && objectType === tree.objectType) {
        return tree;
      }
      return new InterfaceDeclaration(tree.location, tree.name, typeParameters, tree.extendsClause, objectType);
    },
    transformJsxAttribute: function(tree) {
      var value = this.transformAny(tree.value);
      if (value === tree.value) {
        return tree;
      }
      return new JsxAttribute(tree.location, tree.name, value);
    },
    transformJsxElement: function(tree) {
      var name = this.transformAny(tree.name);
      var attributes = this.transformList(tree.attributes);
      var children = this.transformList(tree.children);
      if (name === tree.name && attributes === tree.attributes && children === tree.children) {
        return tree;
      }
      return new JsxElement(tree.location, name, attributes, children);
    },
    transformJsxElementName: function(tree) {
      return tree;
    },
    transformJsxPlaceholder: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new JsxPlaceholder(tree.location, expression);
    },
    transformJsxSpreadAttribute: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new JsxSpreadAttribute(tree.location, expression);
    },
    transformJsxText: function(tree) {
      return tree;
    },
    transformLabelledStatement: function(tree) {
      var statement = this.transformAny(tree.statement);
      if (statement === tree.statement) {
        return tree;
      }
      return new LabelledStatement(tree.location, tree.name, statement);
    },
    transformLiteralExpression: function(tree) {
      return tree;
    },
    transformLiteralPropertyName: function(tree) {
      return tree;
    },
    transformMemberExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      if (operand === tree.operand) {
        return tree;
      }
      return new MemberExpression(tree.location, operand, tree.memberName);
    },
    transformMemberLookupExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      var memberExpression = this.transformAny(tree.memberExpression);
      if (operand === tree.operand && memberExpression === tree.memberExpression) {
        return tree;
      }
      return new MemberLookupExpression(tree.location, operand, memberExpression);
    },
    transformMethod: function(tree) {
      var name = this.transformAny(tree.name);
      var parameterList = this.transformAny(tree.parameterList);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var body = this.transformAny(tree.body);
      var debugName = this.transformAny(tree.debugName);
      if (name === tree.name && parameterList === tree.parameterList && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && body === tree.body && debugName === tree.debugName) {
        return tree;
      }
      return new Method(tree.location, tree.isStatic, tree.functionKind, name, parameterList, typeAnnotation, annotations, body, debugName);
    },
    transformMethodSignature: function(tree) {
      var name = this.transformAny(tree.name);
      var callSignature = this.transformAny(tree.callSignature);
      if (name === tree.name && callSignature === tree.callSignature) {
        return tree;
      }
      return new MethodSignature(tree.location, name, tree.optional, callSignature);
    },
    transformModule: function(tree) {
      var scriptItemList = this.transformList(tree.scriptItemList);
      if (scriptItemList === tree.scriptItemList) {
        return tree;
      }
      return new Module(tree.location, scriptItemList, tree.moduleName);
    },
    transformModuleSpecifier: function(tree) {
      return tree;
    },
    transformNameSpaceExport: function(tree) {
      return tree;
    },
    transformNameSpaceImport: function(tree) {
      var binding = this.transformAny(tree.binding);
      if (binding === tree.binding) {
        return tree;
      }
      return new NameSpaceImport(tree.location, binding);
    },
    transformNamedExport: function(tree) {
      var exportClause = this.transformAny(tree.exportClause);
      var moduleSpecifier = this.transformAny(tree.moduleSpecifier);
      if (exportClause === tree.exportClause && moduleSpecifier === tree.moduleSpecifier) {
        return tree;
      }
      return new NamedExport(tree.location, exportClause, moduleSpecifier);
    },
    transformNewExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      var args = this.transformAny(tree.args);
      if (operand === tree.operand && args === tree.args) {
        return tree;
      }
      return new NewExpression(tree.location, operand, args);
    },
    transformObjectLiteral: function(tree) {
      var propertyNameAndValues = this.transformList(tree.propertyNameAndValues);
      if (propertyNameAndValues === tree.propertyNameAndValues) {
        return tree;
      }
      return new ObjectLiteral(tree.location, propertyNameAndValues);
    },
    transformObjectPattern: function(tree) {
      var fields = this.transformList(tree.fields);
      if (fields === tree.fields) {
        return tree;
      }
      return new ObjectPattern(tree.location, fields);
    },
    transformObjectPatternField: function(tree) {
      var name = this.transformAny(tree.name);
      var element = this.transformAny(tree.element);
      if (name === tree.name && element === tree.element) {
        return tree;
      }
      return new ObjectPatternField(tree.location, name, element);
    },
    transformObjectType: function(tree) {
      var typeMembers = this.transformList(tree.typeMembers);
      if (typeMembers === tree.typeMembers) {
        return tree;
      }
      return new ObjectType(tree.location, typeMembers);
    },
    transformParenExpression: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new ParenExpression(tree.location, expression);
    },
    transformPostfixExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      if (operand === tree.operand) {
        return tree;
      }
      return new PostfixExpression(tree.location, operand, tree.operator);
    },
    transformPredefinedType: function(tree) {
      return tree;
    },
    transformScript: function(tree) {
      var scriptItemList = this.transformList(tree.scriptItemList);
      if (scriptItemList === tree.scriptItemList) {
        return tree;
      }
      return new Script(tree.location, scriptItemList, tree.moduleName);
    },
    transformPropertyNameAssignment: function(tree) {
      var name = this.transformAny(tree.name);
      var value = this.transformAny(tree.value);
      if (name === tree.name && value === tree.value) {
        return tree;
      }
      return new PropertyNameAssignment(tree.location, name, value);
    },
    transformPropertyNameShorthand: function(tree) {
      return tree;
    },
    transformPropertyVariableDeclaration: function(tree) {
      var name = this.transformAny(tree.name);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var annotations = this.transformList(tree.annotations);
      var initializer = this.transformAny(tree.initializer);
      if (name === tree.name && typeAnnotation === tree.typeAnnotation && annotations === tree.annotations && initializer === tree.initializer) {
        return tree;
      }
      return new PropertyVariableDeclaration(tree.location, tree.isStatic, name, typeAnnotation, annotations, initializer);
    },
    transformPropertySignature: function(tree) {
      var name = this.transformAny(tree.name);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      if (name === tree.name && typeAnnotation === tree.typeAnnotation) {
        return tree;
      }
      return new PropertySignature(tree.location, name, tree.optional, typeAnnotation);
    },
    transformRestParameter: function(tree) {
      var identifier = this.transformAny(tree.identifier);
      if (identifier === tree.identifier) {
        return tree;
      }
      return new RestParameter(tree.location, identifier);
    },
    transformReturnStatement: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new ReturnStatement(tree.location, expression);
    },
    transformSetAccessor: function(tree) {
      var name = this.transformAny(tree.name);
      var parameterList = this.transformAny(tree.parameterList);
      var annotations = this.transformList(tree.annotations);
      var body = this.transformAny(tree.body);
      if (name === tree.name && parameterList === tree.parameterList && annotations === tree.annotations && body === tree.body) {
        return tree;
      }
      return new SetAccessor(tree.location, tree.isStatic, name, parameterList, annotations, body);
    },
    transformSpreadExpression: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new SpreadExpression(tree.location, expression);
    },
    transformSpreadPatternElement: function(tree) {
      var lvalue = this.transformAny(tree.lvalue);
      if (lvalue === tree.lvalue) {
        return tree;
      }
      return new SpreadPatternElement(tree.location, lvalue);
    },
    transformSuperExpression: function(tree) {
      return tree;
    },
    transformSwitchStatement: function(tree) {
      var expression = this.transformAny(tree.expression);
      var caseClauses = this.transformList(tree.caseClauses);
      if (expression === tree.expression && caseClauses === tree.caseClauses) {
        return tree;
      }
      return new SwitchStatement(tree.location, expression, caseClauses);
    },
    transformSyntaxErrorTree: function(tree) {
      return tree;
    },
    transformTemplateLiteralExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      var elements = this.transformList(tree.elements);
      if (operand === tree.operand && elements === tree.elements) {
        return tree;
      }
      return new TemplateLiteralExpression(tree.location, operand, elements);
    },
    transformTemplateLiteralPortion: function(tree) {
      return tree;
    },
    transformTemplateSubstitution: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new TemplateSubstitution(tree.location, expression);
    },
    transformThisExpression: function(tree) {
      return tree;
    },
    transformThrowStatement: function(tree) {
      var value = this.transformAny(tree.value);
      if (value === tree.value) {
        return tree;
      }
      return new ThrowStatement(tree.location, value);
    },
    transformTryStatement: function(tree) {
      var body = this.transformAny(tree.body);
      var catchBlock = this.transformAny(tree.catchBlock);
      var finallyBlock = this.transformAny(tree.finallyBlock);
      if (body === tree.body && catchBlock === tree.catchBlock && finallyBlock === tree.finallyBlock) {
        return tree;
      }
      return new TryStatement(tree.location, body, catchBlock, finallyBlock);
    },
    transformTypeAliasDeclaration: function(tree) {
      var value = this.transformAny(tree.value);
      if (value === tree.value) {
        return tree;
      }
      return new TypeAliasDeclaration(tree.location, tree.name, value);
    },
    transformTypeArguments: function(tree) {
      var args = this.transformList(tree.args);
      if (args === tree.args) {
        return tree;
      }
      return new TypeArguments(tree.location, args);
    },
    transformTypeName: function(tree) {
      var moduleName = this.transformAny(tree.moduleName);
      if (moduleName === tree.moduleName) {
        return tree;
      }
      return new TypeName(tree.location, moduleName, tree.name);
    },
    transformTypeParameter: function(tree) {
      var extendsType = this.transformAny(tree.extendsType);
      if (extendsType === tree.extendsType) {
        return tree;
      }
      return new TypeParameter(tree.location, tree.identifierToken, extendsType);
    },
    transformTypeParameters: function(tree) {
      var parameters = this.transformList(tree.parameters);
      if (parameters === tree.parameters) {
        return tree;
      }
      return new TypeParameters(tree.location, parameters);
    },
    transformTypeReference: function(tree) {
      var typeName = this.transformAny(tree.typeName);
      var args = this.transformAny(tree.args);
      if (typeName === tree.typeName && args === tree.args) {
        return tree;
      }
      return new TypeReference(tree.location, typeName, args);
    },
    transformUnaryExpression: function(tree) {
      var operand = this.transformAny(tree.operand);
      if (operand === tree.operand) {
        return tree;
      }
      return new UnaryExpression(tree.location, tree.operator, operand);
    },
    transformUnionType: function(tree) {
      var types = this.transformList(tree.types);
      if (types === tree.types) {
        return tree;
      }
      return new UnionType(tree.location, types);
    },
    transformVariableDeclaration: function(tree) {
      var lvalue = this.transformAny(tree.lvalue);
      var typeAnnotation = this.transformAny(tree.typeAnnotation);
      var initializer = this.transformAny(tree.initializer);
      if (lvalue === tree.lvalue && typeAnnotation === tree.typeAnnotation && initializer === tree.initializer) {
        return tree;
      }
      return new VariableDeclaration(tree.location, lvalue, typeAnnotation, initializer);
    },
    transformVariableDeclarationList: function(tree) {
      var declarations = this.transformList(tree.declarations);
      if (declarations === tree.declarations) {
        return tree;
      }
      return new VariableDeclarationList(tree.location, tree.declarationType, declarations);
    },
    transformVariableStatement: function(tree) {
      var declarations = this.transformAny(tree.declarations);
      if (declarations === tree.declarations) {
        return tree;
      }
      return new VariableStatement(tree.location, declarations);
    },
    transformWhileStatement: function(tree) {
      var condition = this.transformAny(tree.condition);
      var body = this.transformToBlockOrStatement(tree.body);
      if (condition === tree.condition && body === tree.body) {
        return tree;
      }
      return new WhileStatement(tree.location, condition, body);
    },
    transformWithStatement: function(tree) {
      var expression = this.transformAny(tree.expression);
      var body = this.transformToBlockOrStatement(tree.body);
      if (expression === tree.expression && body === tree.body) {
        return tree;
      }
      return new WithStatement(tree.location, expression, body);
    },
    transformYieldExpression: function(tree) {
      var expression = this.transformAny(tree.expression);
      if (expression === tree.expression) {
        return tree;
      }
      return new YieldExpression(tree.location, expression, tree.isYieldFor);
    }
  }, {});
}();
