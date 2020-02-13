"use strict";
var $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createGeneratorInstance_46_js__,
    $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_initGeneratorFunction_46_js__,
    $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createClass_46_js__,
    $__utils_46_js__,
    $__MapImpl_46_js__;
var $__createGeneratorInstance = ($__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createGeneratorInstance_46_js__ = require("traceur/dist/commonjs/runtime/modules/createGeneratorInstance.js"), $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createGeneratorInstance_46_js__ && $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createGeneratorInstance_46_js__.__esModule && $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createGeneratorInstance_46_js__ || {default: $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createGeneratorInstance_46_js__}).default;
var $__initGeneratorFunction = ($__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_initGeneratorFunction_46_js__ = require("traceur/dist/commonjs/runtime/modules/initGeneratorFunction.js"), $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_initGeneratorFunction_46_js__ && $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_initGeneratorFunction_46_js__.__esModule && $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_initGeneratorFunction_46_js__ || {default: $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_initGeneratorFunction_46_js__}).default;
var $__createClass = ($__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createClass_46_js__ = require("traceur/dist/commonjs/runtime/modules/createClass.js"), $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createClass_46_js__ && $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createClass_46_js__.__esModule && $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createClass_46_js__ || {default: $__traceur_47_dist_47_commonjs_47_runtime_47_modules_47_createClass_46_js__}).default;
var isObject = ($__utils_46_js__ = require("./utils.js"), $__utils_46_js__ && $__utils_46_js__.__esModule && $__utils_46_js__ || {default: $__utils_46_js__}).isObject;
var Map = ($__MapImpl_46_js__ = require("./MapImpl.js"), $__MapImpl_46_js__ && $__MapImpl_46_js__.__esModule && $__MapImpl_46_js__ || {default: $__MapImpl_46_js__}).default;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var Set = function() {
  function Set() {
    var iterable = arguments[0];
    if (!isObject(this))
      throw new TypeError('Set called on incompatible type');
    if (hasOwnProperty.call(this, 'map_')) {
      throw new TypeError('Set can not be reentrantly initialised');
    }
    this.map_ = new Map();
    if (iterable !== null && iterable !== undefined) {
      var $__6 = true;
      var $__7 = false;
      var $__8 = undefined;
      try {
        for (var $__4 = void 0,
            $__3 = (iterable)[Symbol.iterator](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
          var item = $__4.value;
          {
            this.add(item);
          }
        }
      } catch ($__9) {
        $__7 = true;
        $__8 = $__9;
      } finally {
        try {
          if (!$__6 && $__3.return != null) {
            $__3.return();
          }
        } finally {
          if ($__7) {
            throw $__8;
          }
        }
      }
    }
  }
  return ($__createClass)(Set, {
    get size() {
      return this.map_.size;
    },
    has: function(key) {
      return this.map_.has(key);
    },
    add: function(key) {
      this.map_.set(key, key);
      return this;
    },
    delete: function(key) {
      return this.map_.delete(key);
    },
    clear: function() {
      return this.map_.clear();
    },
    forEach: function(callbackFn) {
      var thisArg = arguments[1];
      var $__2 = this;
      return this.map_.forEach(function(value, key) {
        callbackFn.call(thisArg, key, key, $__2);
      });
    },
    values: $__initGeneratorFunction(function $__11() {
      var $__12,
          $__13;
      return $__createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              $__12 = $ctx.wrapYieldStar(this.map_.keys()[Symbol.iterator]());
              $ctx.sent = void 0;
              $ctx.action = 'next';
              $ctx.state = 12;
              break;
            case 12:
              $__13 = $__12[$ctx.action]($ctx.sentIgnoreThrow);
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = ($__13.done) ? 3 : 2;
              break;
            case 3:
              $ctx.sent = $__13.value;
              $ctx.state = -2;
              break;
            case 2:
              $ctx.state = 12;
              return $__13.value;
            default:
              return $ctx.end();
          }
      }, $__11, this);
    }),
    entries: $__initGeneratorFunction(function $__14() {
      var $__15,
          $__16;
      return $__createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              $__15 = $ctx.wrapYieldStar(this.map_.entries()[Symbol.iterator]());
              $ctx.sent = void 0;
              $ctx.action = 'next';
              $ctx.state = 12;
              break;
            case 12:
              $__16 = $__15[$ctx.action]($ctx.sentIgnoreThrow);
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = ($__16.done) ? 3 : 2;
              break;
            case 3:
              $ctx.sent = $__16.value;
              $ctx.state = -2;
              break;
            case 2:
              $ctx.state = 12;
              return $__16.value;
            default:
              return $ctx.end();
          }
      }, $__14, this);
    })
  }, {});
}();
Object.defineProperty(Set.prototype, Symbol.iterator, {
  configurable: true,
  writable: true,
  value: Set.prototype.values
});
Object.defineProperty(Set.prototype, 'keys', {
  configurable: true,
  writable: true,
  value: Set.prototype.values
});
Object.defineProperties(module.exports, {
  default: {
    get: function() {
      return Set;
    },
    enumerable: true
  },
  __esModule: {value: true}
});
