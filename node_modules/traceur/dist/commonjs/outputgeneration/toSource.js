"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  toSource: {
    enumerable: true,
    get: function() {
      return toSource;
    }
  }
});
var ParseTreeMapWriter = require("./ParseTreeMapWriter.js").ParseTreeMapWriter;
var ParseTreeWriter = require("./ParseTreeWriter.js").ParseTreeWriter;
var SourceMapGenerator = require("./SourceMapIntegration.js").SourceMapGenerator;
function toSource(tree) {
  var options = arguments[1];
  var outputName = arguments[2] !== (void 0) ? arguments[2] : '<toSourceOutput>';
  var sourceRoot = arguments[3];
  var sourceMapGenerator = options && options.sourceMapGenerator;
  var sourcemaps = options && options.sourceMaps;
  if (!sourceMapGenerator && sourcemaps) {
    sourceMapGenerator = new SourceMapGenerator({
      file: outputName,
      sourceRoot: sourceRoot,
      skipValidation: true
    });
  }
  var sourceMapConfiguration = {
    sourceMapGenerator: sourceMapGenerator,
    sourceRoot: sourceRoot,
    lowResolution: options && options.lowResolutionSourceMap
  };
  var writer;
  if (sourceMapGenerator)
    writer = new ParseTreeMapWriter(sourceMapConfiguration, options);
  else
    writer = new ParseTreeWriter(options);
  writer.visitAny(tree);
  return [writer.toString(), sourceMapGenerator && sourceMapGenerator.toString()];
}
