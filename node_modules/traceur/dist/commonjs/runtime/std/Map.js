"use strict";
var $___46__46__47_polyfills_47_MapImpl_46_js__;
var MapImpl = ($___46__46__47_polyfills_47_MapImpl_46_js__ = require("../polyfills/MapImpl.js"), $___46__46__47_polyfills_47_MapImpl_46_js__ && $___46__46__47_polyfills_47_MapImpl_46_js__.__esModule && $___46__46__47_polyfills_47_MapImpl_46_js__ || {default: $___46__46__47_polyfills_47_MapImpl_46_js__}).default;
var JsMap;
if (typeof Map === 'function') {
  JsMap = Map;
} else {
  JsMap = MapImpl;
}
Object.defineProperties(module.exports, {
  default: {
    get: function() {
      return JsMap;
    },
    enumerable: true
  },
  __esModule: {value: true}
});
