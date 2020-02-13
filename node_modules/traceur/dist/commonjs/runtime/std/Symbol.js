"use strict";
var $___46__46__47_polyfills_47_SymbolImpl_46_js__;
var SymbolImpl = ($___46__46__47_polyfills_47_SymbolImpl_46_js__ = require("../polyfills/SymbolImpl.js"), $___46__46__47_polyfills_47_SymbolImpl_46_js__ && $___46__46__47_polyfills_47_SymbolImpl_46_js__.__esModule && $___46__46__47_polyfills_47_SymbolImpl_46_js__ || {default: $___46__46__47_polyfills_47_SymbolImpl_46_js__}).default;
var JsSymbol;
if (typeof Symbol === 'function') {
  JsSymbol = Symbol;
} else {
  JsSymbol = SymbolImpl;
}
Object.defineProperties(module.exports, {
  default: {
    get: function() {
      return JsSymbol;
    },
    enumerable: true
  },
  __esModule: {value: true}
});
