"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  System: {
    enumerable: true,
    get: function() {
      return traceurLoader;
    }
  }
});
var BrowserTraceurLoader = require("../loader/TraceurLoader.js").BrowserTraceurLoader;
var traceurLoader = new BrowserTraceurLoader();
Reflect.global.System = traceurLoader;
traceurLoader.map = traceurLoader.semverMap('traceur@' + traceurLoader.version);
$traceurRuntime.normalizeModuleName = traceurLoader.normalize.bind(traceurLoader);
