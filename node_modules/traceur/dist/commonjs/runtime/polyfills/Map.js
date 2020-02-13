"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  Map: {
    enumerable: true,
    get: function() {
      return Map;
    }
  },
  polyfillMap: {
    enumerable: true,
    get: function() {
      return polyfillMap;
    }
  }
});
var $__createGeneratorInstance = $__interopRequire("traceur/dist/commonjs/runtime/modules/createGeneratorInstance.js").default;
var $__initGeneratorFunction = $__interopRequire("traceur/dist/commonjs/runtime/modules/initGeneratorFunction.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__19 = require("../private.js"),
    createPrivateSymbol = $__19.createPrivateSymbol,
    getPrivate = $__19.getPrivate,
    setPrivate = $__19.setPrivate;
var $__20 = require("../frozen-data.js"),
    deleteFrozen = $__20.deleteFrozen,
    getFrozen = $__20.getFrozen,
    setFrozen = $__20.setFrozen;
var $__21 = require("./utils.js"),
    isObject = $__21.isObject,
    registerPolyfill = $__21.registerPolyfill;
var hasNativeSymbol = $__interopRequire("../has-native-symbols.js").default;
var $__9 = Object,
    defineProperty = $__9.defineProperty,
    getOwnPropertyDescriptor = $__9.getOwnPropertyDescriptor,
    hasOwnProperty = $__9.hasOwnProperty,
    isExtensible = $__9.isExtensible;
var deletedSentinel = {};
var counter = 1;
var hashCodeName = createPrivateSymbol();
function getHashCodeForObject(obj) {
  return getPrivate(obj, hashCodeName);
}
function getOrSetHashCodeForObject(obj) {
  var hash = getHashCodeForObject(obj);
  if (!hash) {
    hash = counter++;
    setPrivate(obj, hashCodeName, hash);
  }
  return hash;
}
function lookupIndex(map, key) {
  if (typeof key === 'string') {
    return map.stringIndex_[key];
  }
  if (isObject(key)) {
    if (!isExtensible(key)) {
      return getFrozen(map.frozenData_, key);
    }
    var hc = getHashCodeForObject(key);
    if (hc === undefined) {
      return undefined;
    }
    return map.objectIndex_[hc];
  }
  return map.primitiveIndex_[key];
}
function initMap(map) {
  map.entries_ = [];
  map.objectIndex_ = Object.create(null);
  map.stringIndex_ = Object.create(null);
  map.primitiveIndex_ = Object.create(null);
  map.frozenData_ = [];
  map.deletedCount_ = 0;
}
var Map = function() {
  function Map() {
    var $__11,
        $__12;
    var iterable = arguments[0];
    if (!isObject(this))
      throw new TypeError('Map called on incompatible type');
    if (hasOwnProperty.call(this, 'entries_')) {
      throw new TypeError('Map can not be reentrantly initialised');
    }
    initMap(this);
    if (iterable !== null && iterable !== undefined) {
      var $__5 = true;
      var $__6 = false;
      var $__7 = undefined;
      try {
        for (var $__3 = void 0,
            $__2 = (iterable)[Symbol.iterator](); !($__5 = ($__3 = $__2.next()).done); $__5 = true) {
          var $__10 = $__3.value,
              key = ($__11 = $__10[Symbol.iterator](), ($__12 = $__11.next()).done ? void 0 : $__12.value),
              value = ($__12 = $__11.next()).done ? void 0 : $__12.value;
          {
            this.set(key, value);
          }
        }
      } catch ($__8) {
        $__6 = true;
        $__7 = $__8;
      } finally {
        try {
          if (!$__5 && $__2.return != null) {
            $__2.return();
          }
        } finally {
          if ($__6) {
            throw $__7;
          }
        }
      }
    }
  }
  return ($__createClass)(Map, {
    get size() {
      return this.entries_.length / 2 - this.deletedCount_;
    },
    get: function(key) {
      var index = lookupIndex(this, key);
      if (index !== undefined) {
        return this.entries_[index + 1];
      }
    },
    set: function(key, value) {
      var index = lookupIndex(this, key);
      if (index !== undefined) {
        this.entries_[index + 1] = value;
      } else {
        index = this.entries_.length;
        this.entries_[index] = key;
        this.entries_[index + 1] = value;
        if (isObject(key)) {
          if (!isExtensible(key)) {
            setFrozen(this.frozenData_, key, index);
          } else {
            var hash = getOrSetHashCodeForObject(key);
            this.objectIndex_[hash] = index;
          }
        } else if (typeof key === 'string') {
          this.stringIndex_[key] = index;
        } else {
          this.primitiveIndex_[key] = index;
        }
      }
      return this;
    },
    has: function(key) {
      return lookupIndex(this, key) !== undefined;
    },
    delete: function(key) {
      var index = lookupIndex(this, key);
      if (index === undefined) {
        return false;
      }
      this.entries_[index] = deletedSentinel;
      this.entries_[index + 1] = undefined;
      this.deletedCount_++;
      if (isObject(key)) {
        if (!isExtensible(key)) {
          deleteFrozen(this.frozenData_, key);
        } else {
          var hash = getHashCodeForObject(key);
          delete this.objectIndex_[hash];
        }
      } else if (typeof key === 'string') {
        delete this.stringIndex_[key];
      } else {
        delete this.primitiveIndex_[key];
      }
      return true;
    },
    clear: function() {
      initMap(this);
    },
    forEach: function(callbackFn) {
      var thisArg = arguments[1];
      for (var i = 0; i < this.entries_.length; i += 2) {
        var key = this.entries_[i];
        var value = this.entries_[i + 1];
        if (key === deletedSentinel)
          continue;
        callbackFn.call(thisArg, value, key, this);
      }
    },
    entries: $__initGeneratorFunction(function $__13() {
      var i,
          key,
          value;
      return $__createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return [key, value];
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__13, this);
    }),
    keys: $__initGeneratorFunction(function $__14() {
      var i,
          key,
          value;
      return $__createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return key;
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__14, this);
    }),
    values: $__initGeneratorFunction(function $__15() {
      var i,
          key,
          value;
      return $__createGeneratorInstance(function($ctx) {
        while (true)
          switch ($ctx.state) {
            case 0:
              i = 0;
              $ctx.state = 12;
              break;
            case 12:
              $ctx.state = (i < this.entries_.length) ? 8 : -2;
              break;
            case 4:
              i += 2;
              $ctx.state = 12;
              break;
            case 8:
              key = this.entries_[i];
              value = this.entries_[i + 1];
              $ctx.state = 9;
              break;
            case 9:
              $ctx.state = (key === deletedSentinel) ? 4 : 6;
              break;
            case 6:
              $ctx.state = 2;
              return value;
            case 2:
              $ctx.maybeThrow();
              $ctx.state = 4;
              break;
            default:
              return $ctx.end();
          }
      }, $__15, this);
    })
  }, {});
}();
defineProperty(Map.prototype, Symbol.iterator, {
  configurable: true,
  writable: true,
  value: Map.prototype.entries
});
function needsPolyfill(global) {
  var $__10 = global,
      Map = $__10.Map,
      Symbol = $__10.Symbol;
  if (!Map || !hasNativeSymbol() || !Map.prototype[Symbol.iterator] || !Map.prototype.entries) {
    return true;
  }
  try {
    return new Map([[]]).size !== 1;
  } catch (e) {
    return false;
  }
}
function polyfillMap(global) {
  if (needsPolyfill(global)) {
    global.Map = Map;
  }
}
registerPolyfill(polyfillMap);
