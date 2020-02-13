"use strict";
var $__Compiler_46_js__ = require("./Compiler.js");
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  Compiler: {
    enumerable: true,
    get: function() {
      return $__Compiler_46_js__.Compiler;
    }
  },
  syntax: {
    enumerable: true,
    get: function() {
      return syntax;
    }
  },
  outputgeneration: {
    enumerable: true,
    get: function() {
      return outputgeneration;
    }
  },
  codegeneration: {
    enumerable: true,
    get: function() {
      return codegeneration;
    }
  }
});
var Parser = require("./syntax/Parser.js").Parser;
var Script = require("./syntax/trees/ParseTrees.js").Script;
var SourceFile = require("./syntax/SourceFile.js").SourceFile;
var syntax = {
  Parser: Parser,
  SourceFile: SourceFile,
  trees: {Script: Script}
};
var ParseTreeMapWriter = require("./outputgeneration/ParseTreeMapWriter.js").ParseTreeMapWriter;
var ParseTreeWriter = require("./outputgeneration/ParseTreeWriter.js").ParseTreeWriter;
var regexpuRewritePattern = require("./outputgeneration/regexpuRewritePattern.js").regexpuRewritePattern;
var SourceMapConsumer = require("./outputgeneration/SourceMapIntegration.js").SourceMapConsumer;
var SourceMapGenerator = require("./outputgeneration/SourceMapIntegration.js").SourceMapGenerator;
var TreeWriter = require("./outputgeneration/TreeWriter.js").TreeWriter;
var outputgeneration = {
  ParseTreeMapWriter: ParseTreeMapWriter,
  ParseTreeWriter: ParseTreeWriter,
  regexpuRewritePattern: regexpuRewritePattern,
  SourceMapConsumer: SourceMapConsumer,
  SourceMapGenerator: SourceMapGenerator,
  TreeWriter: TreeWriter
};
var AttachModuleNameTransformer = require("./codegeneration/module/AttachModuleNameTransformer.js").AttachModuleNameTransformer;
var CloneTreeTransformer = require("./codegeneration/CloneTreeTransformer.js").CloneTreeTransformer;
var FromOptionsTransformer = require("./codegeneration/FromOptionsTransformer.js").FromOptionsTransformer;
var PureES6Transformer = require("./codegeneration/PureES6Transformer.js").PureES6Transformer;
var createModuleEvaluationStatement = require("./codegeneration/module/createModuleEvaluationStatement.js").createModuleEvaluationStatement;
var $__16 = require("./codegeneration/PlaceholderParser.js"),
    parseExpression = $__16.parseExpression,
    parseModule = $__16.parseModule,
    parseScript = $__16.parseScript,
    parseStatement = $__16.parseStatement;
var codegeneration = {
  CloneTreeTransformer: CloneTreeTransformer,
  FromOptionsTransformer: FromOptionsTransformer,
  PureES6Transformer: PureES6Transformer,
  parseExpression: parseExpression,
  parseModule: parseModule,
  parseScript: parseScript,
  parseStatement: parseStatement,
  module: {
    AttachModuleNameTransformer: AttachModuleNameTransformer,
    createModuleEvaluationStatement: createModuleEvaluationStatement
  }
};
