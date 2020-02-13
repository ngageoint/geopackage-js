"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  ParseTreeMapWriter: {
    enumerable: true,
    get: function() {
      return ParseTreeMapWriter;
    }
  },
  relativePath: {
    enumerable: true,
    get: function() {
      return relativePath;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var ParseTreeWriter = require("./ParseTreeWriter.js").ParseTreeWriter;
var StringSet = require("../util/StringSet.js").StringSet;
var ParseTreeMapWriter = function($__super) {
  function ParseTreeMapWriter(sourceMapConfiguration) {
    var options = arguments[1];
    $__superConstructor(ParseTreeMapWriter).call(this, options);
    this.sourceMapGenerator_ = sourceMapConfiguration.sourceMapGenerator;
    this.lowResolution_ = sourceMapConfiguration.lowResolution;
    this.basepath_ = sourceMapConfiguration.basepath;
    this.outputLineCount_ = 1;
    this.isFirstMapping_ = true;
    this.sourcesInMap_ = new StringSet();
    this.relativeSourceName_ = '';
    this.generated_ = null;
    this.original_ = null;
    this.previousMapping_ = null;
  }
  return ($__createClass)(ParseTreeMapWriter, {
    visitAny: function(tree) {
      if (tree === null) {
        return;
      }
      if (tree.location !== null)
        this.enterBranch(tree.location);
      $__superGet(this, ParseTreeMapWriter.prototype, "visitAny").call(this, tree);
      if (tree.location !== null)
        this.exitBranch(tree.location);
    },
    writeCurrentln_: function() {
      $__superGet(this, ParseTreeMapWriter.prototype, "writeCurrentln_").call(this);
      this.flushMappings();
      this.outputLineCount_++;
      this.generated_ = {
        line: this.outputLineCount_,
        column: 0
      };
      this.flushMappings();
    },
    write_: function(value) {
      this.generate();
      $__superGet(this, ParseTreeMapWriter.prototype, "write_").call(this, value);
      this.generate();
    },
    generate: function() {
      var length = this.currentLine_.length;
      var column = length ? length - 1 : 0;
      this.generated_ = {
        line: this.outputLineCount_,
        column: column
      };
      this.flushMappings();
    },
    enterBranch: function(location) {
      var $__2 = location.start,
          line = $__2.line,
          column = $__2.column,
          source = $__2.source;
      this.originate(line, column, source);
    },
    exitBranch: function(location) {
      var $__2 = location.end,
          line = $__2.line,
          column = $__2.column,
          source = $__2.source;
      this.originate(line, column ? column - 1 : 0, source);
    },
    originate: function(line, column, source) {
      line++;
      if (this.original_ && this.original_.line !== line)
        this.flushMappings();
      this.original_ = {
        line: line,
        column: column
      };
      var name = source.name;
      if (name && !this.sourcesInMap_.has(name)) {
        this.sourcesInMap_.add(name);
        this.relativeSourceName_ = relativePath(name, this.basepath_);
        this.sourceMapGenerator_.setSourceContent(this.relativeSourceName_, source.contents);
      }
      this.flushMappings();
    },
    flushMappings: function() {
      if (this.original_ && this.generated_) {
        this.addMapping();
        this.original_ = null;
        this.generated_ = null;
      }
    },
    isSame: function(lhs, rhs) {
      return lhs.line === rhs.line && lhs.column === rhs.column;
    },
    skipMapping: function() {
      if (!this.previousMapping_)
        return false;
      if (this.lowResolution_ && this.previousMapping_.generated.line === this.generated_.line)
        return true;
      if (this.isSame(this.previousMapping_.generated, this.generated_) && this.isSame(this.previousMapping_.original, this.original_))
        return true;
    },
    addMapping: function() {
      if (this.skipMapping())
        return;
      var mapping = {
        generated: this.generated_,
        original: this.original_,
        source: this.relativeSourceName_
      };
      this.sourceMapGenerator_.addMapping(mapping);
      this.previousMapping_ = mapping;
    }
  }, {}, $__super);
}(ParseTreeWriter);
function relativePath(name, sourceRoot) {
  var $__3;
  if (!name || name[0] === '@')
    return name;
  if (!sourceRoot)
    return name;
  var nameSegments = name.split('/');
  var rootSegments = sourceRoot.split('/');
  if (rootSegments[rootSegments.length - 1]) {
    throw new Error('rootPath must end in /');
  }
  var commonSegmentsLength = 0;
  var uniqueSegments = [];
  var foundUnique = false;
  nameSegments.forEach(function(segment, index) {
    if (!foundUnique && segment === rootSegments[index]) {
      commonSegmentsLength++;
      return;
    }
    foundUnique = true;
    uniqueSegments.push(segment);
  });
  if (commonSegmentsLength < 1 || commonSegmentsLength === rootSegments.length)
    return name;
  var dotDotSegments = rootSegments.length - commonSegmentsLength - 1;
  var segments = [];
  while (dotDotSegments--) {
    segments.push('..');
  }
  ($__3 = segments).push.apply($__3, $__spread(uniqueSegments));
  return segments.join('/');
}
