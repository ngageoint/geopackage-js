"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  Compiler: {
    enumerable: true,
    get: function() {
      return Compiler;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var AttachModuleNameTransformer = require("./codegeneration/module/AttachModuleNameTransformer.js").AttachModuleNameTransformer;
var FromOptionsTransformer = require("./codegeneration/FromOptionsTransformer.js").FromOptionsTransformer;
var Parser = require("./syntax/Parser.js").Parser;
var PureES6Transformer = require("./codegeneration/PureES6Transformer.js").PureES6Transformer;
var SourceFile = require("./syntax/SourceFile.js").SourceFile;
var CollectingErrorReporter = require("./util/CollectingErrorReporter.js").CollectingErrorReporter;
var $__11 = require("./Options.js"),
    Options = $__11.Options,
    versionLockedOptions = $__11.versionLockedOptions;
var ParseTreeMapWriter = require("./outputgeneration/ParseTreeMapWriter.js").ParseTreeMapWriter;
var ParseTreeWriter = require("./outputgeneration/ParseTreeWriter.js").ParseTreeWriter;
var $__14 = require("./outputgeneration/SourceMapIntegration.js"),
    SourceMapConsumer = $__14.SourceMapConsumer,
    SourceMapGenerator = $__14.SourceMapGenerator;
function merge() {
  for (var srcs = [],
      $__2 = 0; $__2 < arguments.length; $__2++)
    srcs[$__2] = arguments[$__2];
  var dest = Object.create(null);
  srcs.forEach(function(src) {
    Object.keys(src).forEach(function(key) {
      dest[key] = src[key];
    });
    var srcModules = src.modules;
    if (typeof srcModules !== 'undefined') {
      dest.modules = srcModules;
    }
  });
  return dest;
}
function basePath(name) {
  if (!name)
    return null;
  var lastSlash = name.lastIndexOf('/');
  if (lastSlash < 0)
    return null;
  return name.substring(0, lastSlash + 1);
}
var Compiler = function() {
  function Compiler() {
    var overridingOptions = arguments[0] !== (void 0) ? arguments[0] : {};
    this.options_ = new Options(this.defaultOptions());
    this.options_.setFromObject(overridingOptions);
    this.sourceMapConfiguration_ = null;
    this.sourceMapInfo_ = null;
    this.sourceMapCache_ = null;
  }
  return ($__createClass)(Compiler, {
    compile: function(content) {
      var sourceName = arguments[1] !== (void 0) ? arguments[1] : '<compileSource>';
      var outputName = arguments[2] !== (void 0) ? arguments[2] : '<compileOutput>';
      var sourceRoot = arguments[3];
      sourceName = this.normalize(sourceName);
      outputName = this.normalize(outputName);
      var tree = this.parse(content, sourceName);
      tree = this.transform(tree, sourceName);
      var sourceURL = sourceName !== outputName ? sourceName : undefined;
      if (sourceRoot === undefined)
        sourceRoot = this.options_.sourceRoot;
      return this.write(tree, outputName, sourceRoot, sourceURL);
    },
    throwIfErrors: function(errorReporter) {
      if (errorReporter.hadError())
        throw errorReporter.toError();
    },
    parse: function(content) {
      var sourceName = arguments[1] !== (void 0) ? arguments[1] : '<compiler-parse-input>';
      sourceName = this.normalize(sourceName);
      this.sourceMapCache_ = null;
      this.sourceMapConfiguration_ = null;
      var errorReporter = new CollectingErrorReporter();
      var sourceFile = new SourceFile(sourceName, content);
      var parser = new Parser(sourceFile, errorReporter, this.options_);
      var tree = this.options_.script ? parser.parseScript() : parser.parseModule();
      this.throwIfErrors(errorReporter);
      return tree;
    },
    transform: function(tree) {
      var candidateModuleName = arguments[1];
      var metadata = arguments[2];
      var transformer;
      if (candidateModuleName) {
        var transformer$__3 = new AttachModuleNameTransformer(candidateModuleName);
        tree = transformer$__3.transformAny(tree);
      }
      var errorReporter = new CollectingErrorReporter();
      if (this.options_.outputLanguage.toLowerCase() === 'es6') {
        transformer = new PureES6Transformer(errorReporter, this.options_, metadata);
      } else {
        transformer = new FromOptionsTransformer(errorReporter, this.options_);
      }
      var transformedTree = transformer.transform(tree);
      this.throwIfErrors(errorReporter);
      return transformedTree;
    },
    createSourceMapConfiguration_: function(outputName) {
      var sourceRoot = arguments[1];
      var sourceURL = arguments[2];
      if (this.options_.sourceMaps) {
        return {
          sourceMapGenerator: new SourceMapGenerator({
            file: outputName,
            sourceRoot: sourceRoot,
            skipValidation: true
          }),
          basepath: basePath(outputName),
          inputSourceMap: this.options_.inputSourceMap,
          sourceURL: sourceURL,
          outputName: outputName
        };
      }
    },
    getSourceMap: function() {
      if (this.sourceMapCache_) {
        return this.sourceMapCache_;
      }
      if (this.sourceMapConfiguration_) {
        var sourceMap = this.sourceMapConfiguration_.sourceMapGenerator.toString();
        var inputSourceMap = this.sourceMapConfiguration_.inputSourceMap;
        if (inputSourceMap) {
          var generator = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(sourceMap));
          generator.applySourceMap(new SourceMapConsumer(inputSourceMap));
          sourceMap = generator.toJSON();
        }
        this.sourceMapCache_ = sourceMap;
        return sourceMap;
      }
    },
    get sourceMapInfo() {
      if (!this.sourceMapInfo_ && this.sourceMapConfiguration_) {
        var sourceMap = this.getSourceMap();
        this.sourceMapInfo_ = {
          url: this.sourceMapConfiguration_.sourceURL,
          outputName: this.sourceMapConfiguration_.outputName,
          map: sourceMap
        };
      }
      return this.sourceMapInfo_;
    },
    write: function(tree) {
      var outputName = arguments[1];
      var sourceRoot = arguments[2];
      var sourceURL = arguments[3];
      outputName = this.normalize(outputName);
      if (sourceRoot === undefined)
        sourceRoot = this.options_.sourceRoot;
      if (sourceRoot === true)
        sourceRoot = basePath(outputName);
      else if (!sourceRoot)
        sourceRoot = undefined;
      else
        sourceRoot = this.normalize(sourceRoot);
      var writer;
      this.sourceMapCache_ = null;
      this.sourceMapConfiguration_ = this.createSourceMapConfiguration_(outputName, sourceRoot, sourceURL);
      if (this.sourceMapConfiguration_) {
        this.sourceMapConfiguration_.lowResolution = this.options_.lowResolutionSourceMap;
        writer = new ParseTreeMapWriter(this.sourceMapConfiguration_, this.options_);
      } else {
        writer = new ParseTreeWriter(this.options_);
      }
      writer.visitAny(tree);
      var compiledCode = writer.toString();
      var link = this.debuggerLink(sourceURL, outputName);
      if (link) {
        compiledCode += link;
      }
      return compiledCode;
    },
    debuggerLink: function(sourceURL, outputName) {
      if (this.sourceMapConfiguration_) {
        if (this.options_.sourceMaps === 'memory') {
          return;
        }
        var sourceMappingURL = this.sourceMappingURL(sourceURL || outputName || 'unnamed.js');
        return '//# sourceMappingURL=' + sourceMappingURL + '\n';
      } else {
        if (sourceURL) {
          return '//# sourceURL=' + sourceURL + '\n';
        }
      }
    },
    sourceName: function(filename) {
      return filename;
    },
    sourceMappingURL: function(path) {
      if (this.options_.sourceMaps === 'inline') {
        if (Reflect.global.btoa) {
          return 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(this.getSourceMap())));
        }
      }
      path = path || 'unamed.js';
      path = path.split('/').pop();
      return path + '.map';
    },
    sourceNameFromTree: function(tree) {
      return tree.location.start.source.name;
    },
    defaultOptions: function() {
      return versionLockedOptions;
    },
    normalize: function(name) {
      return name && name.replace(/\\/g, '/');
    }
  }, {
    script: function(content) {
      var options = arguments[1] !== (void 0) ? arguments[1] : {};
      options = new Options(options);
      options.script = true;
      return new Compiler(options).compile(content);
    },
    module: function(content) {
      var options = arguments[1] !== (void 0) ? arguments[1] : {};
      options = new Options(options);
      options.modules = 'bootstrap';
      return new Compiler(options).compile(content);
    },
    amdOptions: function() {
      var options = arguments[0] !== (void 0) ? arguments[0] : {};
      var amdOptions = {
        modules: 'amd',
        sourceMaps: false,
        moduleName: false
      };
      return merge(amdOptions, options);
    },
    closureOptions: function() {
      var options = arguments[0] !== (void 0) ? arguments[0] : {};
      var closureOptions = {
        modules: 'closure',
        sourceMaps: false,
        moduleName: true
      };
      return merge(closureOptions, options);
    },
    commonJSOptions: function() {
      var options = arguments[0] !== (void 0) ? arguments[0] : {};
      var commonjsOptions = {
        modules: 'commonjs',
        sourceMaps: false,
        moduleName: false
      };
      return merge(commonjsOptions, options);
    }
  });
}();
