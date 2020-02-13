"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  loader: {
    enumerable: true,
    get: function() {
      return loader;
    }
  }
});
var Loader = require("./Loader.js").Loader;
var LoaderCompiler = require("./LoaderCompiler.js").LoaderCompiler;
var BrowserTraceurLoader = require("./TraceurLoader.js").BrowserTraceurLoader;
var NodeLoaderCompiler = require("../node/NodeLoaderCompiler.js").NodeLoaderCompiler;
var InlineLoaderCompiler = require("./InlineLoaderCompiler.js").InlineLoaderCompiler;
var NodeTraceurLoader = require("./NodeTraceurLoader.js").NodeTraceurLoader;
var TraceurLoader = require("./TraceurLoader.js").TraceurLoader;
var loader = {
  BrowserTraceurLoader: BrowserTraceurLoader,
  InlineLoaderCompiler: InlineLoaderCompiler,
  Loader: Loader,
  LoaderCompiler: LoaderCompiler,
  NodeLoaderCompiler: NodeLoaderCompiler,
  NodeTraceurLoader: NodeTraceurLoader,
  TraceurLoader: TraceurLoader
};
