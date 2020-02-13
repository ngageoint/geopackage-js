"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return getDependencies;
    }
  }
});
var ModuleSpecifierVisitor = require("../codegeneration/module/ModuleSpecifierVisitor.js").ModuleSpecifierVisitor;
var Parser = require("../syntax/Parser.js").Parser;
var SourceFile = require("../syntax/SourceFile.js").SourceFile;
var $__9 = require('path'),
    normalize = $__9.normalize,
    resolve = $__9.resolve,
    dirname = $__9.dirname;
var readFileSync = require('fs').readFileSync;
function addDependencies(deps, path) {
  path = resolve(path);
  if (deps.has(path))
    return;
  var content = readFileSync(path, 'utf-8');
  var sourceFile = new SourceFile(path, content);
  var parser = new Parser(sourceFile);
  var tree = parser.parseModule();
  var options = {};
  var visitor = new ModuleSpecifierVisitor(options);
  visitor.visitAny(tree);
  deps.add(path);
  var $__4 = true;
  var $__5 = false;
  var $__6 = undefined;
  try {
    for (var $__2 = void 0,
        $__1 = (visitor.moduleSpecifiers)[Symbol.iterator](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
      var spec = $__2.value;
      {
        var resolved = resolve(dirname(path), spec);
        addDependencies(deps, resolved);
      }
    }
  } catch ($__7) {
    $__5 = true;
    $__6 = $__7;
  } finally {
    try {
      if (!$__4 && $__1.return != null) {
        $__1.return();
      }
    } finally {
      if ($__5) {
        throw $__6;
      }
    }
  }
}
function getDependencies() {
  for (var paths = [],
      $__8 = 0; $__8 < arguments.length; $__8++)
    paths[$__8] = arguments[$__8];
  var deps = new Set();
  var $__4 = true;
  var $__5 = false;
  var $__6 = undefined;
  try {
    for (var $__2 = void 0,
        $__1 = (paths)[Symbol.iterator](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
      var path = $__2.value;
      {
        addDependencies(deps, path);
      }
    }
  } catch ($__7) {
    $__5 = true;
    $__6 = $__7;
  } finally {
    try {
      if (!$__4 && $__1.return != null) {
        $__1.return();
      }
    } finally {
      if ($__5) {
        throw $__6;
      }
    }
  }
  return deps;
}
