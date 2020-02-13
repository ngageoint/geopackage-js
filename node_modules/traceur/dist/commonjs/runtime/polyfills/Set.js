"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  Set: {
    enumerable: true,
    get: function() {
      return Set;
    }
  },
  polyfillSet: {
    enumerable: true,
    get: function() {
      return polyfillSet;
    }
  }
});
var $__createGeneratorInstance = $__interopRequire("traceur/dist/commonjs/runtime/modules/createGeneratorInstance.js").default;
var $__initGeneratorFunction = $__interopRequire("traceur/dist/commonjs/runtime/modules/initGeneratorFunction.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__21 = require("./utils.js"),
    isObject = $__21.isObject,
    registerPolyfill = $__21.registerPolyfill;
var Map = require("./Map.js").Map;
var hasNativeSymbol = $__interopRequire("../has-native-symbols.js").default;
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
    values: $__initGeneratorFunction(function $__12() {
      var $__13,
          $__14;
      return $__createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              $__13 = $ctx.wrapYieldStar(this.map_.keys()[Symbol.iterator]());
              $ctx.sent = void 0;
              $ctx.action = 'next';
              $ctx.state = 12;
              break;
            case 12:
              $__14 = $__13[$ctx.action]($ctx.sentIgnoreThrow);
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = ($__14.done) ? 3 : 2;
              break;
            case 3:
              $ctx.sent = $__14.value;
              $ctx.state = -2;
              break;
            case 2:
              $ctx.state = 12;
              return $__14.value;
            default:
              return $ctx.end();
          }
      }, $__12, this);
    }),
    entries: $__initGeneratorFunction(function $__15() {
      var $__16,
          $__17;
      return $__createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              $__16 = $ctx.wrapYieldStar(this.map_.entries()[Symbol.iterator]());
              $ctx.sent = void 0;
              $ctx.action = 'next';
              $ctx.state = 12;
              break;
            case 12:
              $__17 = $__16[$ctx.action]($ctx.sentIgnoreThrow);
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = ($__17.done) ? 3 : 2;
              break;
            case 3:
              $ctx.sent = $__17.value;
              $ctx.state = -2;
              break;
            case 2:
              $ctx.state = 12;
              return $__17.value;
            default:
              return $ctx.end();
          }
      }, $__15, this);
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
function needsPolyfill(global) {
  var $__11 = global,
      Set = $__11.Set,
      Symbol = $__11.Symbol;
  if (!Set || !hasNativeSymbol() || !Set.prototype[Symbol.iterator] || !Set.prototype.values) {
    return true;
  }
  try {
    return new Set([1]).size !== 1;
  } catch (e) {
    return false;
  }
}
function polyfillSet(global) {
  if (needsPolyfill(global)) {
    global.Set = Set;
  }
}
registerPolyfill(polyfillSet);
