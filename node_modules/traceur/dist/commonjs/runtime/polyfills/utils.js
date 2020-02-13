"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  toObject: {
    enumerable: true,
    get: function() {
      return toObject;
    }
  },
  toUint32: {
    enumerable: true,
    get: function() {
      return toUint32;
    }
  },
  isObject: {
    enumerable: true,
    get: function() {
      return isObject;
    }
  },
  isCallable: {
    enumerable: true,
    get: function() {
      return isCallable;
    }
  },
  isNumber: {
    enumerable: true,
    get: function() {
      return isNumber;
    }
  },
  toInteger: {
    enumerable: true,
    get: function() {
      return toInteger;
    }
  },
  toLength: {
    enumerable: true,
    get: function() {
      return toLength;
    }
  },
  checkIterable: {
    enumerable: true,
    get: function() {
      return checkIterable;
    }
  },
  isConstructor: {
    enumerable: true,
    get: function() {
      return isConstructor;
    }
  },
  createIteratorResultObject: {
    enumerable: true,
    get: function() {
      return createIteratorResultObject;
    }
  },
  maybeDefine: {
    enumerable: true,
    get: function() {
      return maybeDefine;
    }
  },
  maybeDefineMethod: {
    enumerable: true,
    get: function() {
      return maybeDefineMethod;
    }
  },
  maybeDefineConst: {
    enumerable: true,
    get: function() {
      return maybeDefineConst;
    }
  },
  maybeAddFunctions: {
    enumerable: true,
    get: function() {
      return maybeAddFunctions;
    }
  },
  maybeAddConsts: {
    enumerable: true,
    get: function() {
      return maybeAddConsts;
    }
  },
  maybeAddIterator: {
    enumerable: true,
    get: function() {
      return maybeAddIterator;
    }
  },
  registerPolyfill: {
    enumerable: true,
    get: function() {
      return registerPolyfill;
    }
  },
  polyfillAll: {
    enumerable: true,
    get: function() {
      return polyfillAll;
    }
  }
});
var $ceil = Math.ceil;
var $floor = Math.floor;
var $isFinite = isFinite;
var $isNaN = isNaN;
var $pow = Math.pow;
var $min = Math.min;
var $TypeError = TypeError;
var $Object = Object;
function toObject(x) {
  if (x == null) {
    throw $TypeError();
  }
  return $Object(x);
}
function toUint32(x) {
  return x >>> 0;
}
function isObject(x) {
  return x && (typeof x === 'object' || typeof x === 'function');
}
function isCallable(x) {
  return typeof x === 'function';
}
function isNumber(x) {
  return typeof x === 'number';
}
function toInteger(x) {
  x = +x;
  if ($isNaN(x))
    return 0;
  if (x === 0 || !$isFinite(x))
    return x;
  return x > 0 ? $floor(x) : $ceil(x);
}
var MAX_SAFE_LENGTH = $pow(2, 53) - 1;
function toLength(x) {
  var len = toInteger(x);
  return len < 0 ? 0 : $min(len, MAX_SAFE_LENGTH);
}
function checkIterable(x) {
  return !isObject(x) ? undefined : x[Symbol.iterator];
}
function isConstructor(x) {
  return isCallable(x);
}
function createIteratorResultObject(value, done) {
  return {
    value: value,
    done: done
  };
}
function maybeDefine(object, name, descr) {
  if (!(name in object)) {
    Object.defineProperty(object, name, descr);
  }
}
function maybeDefineMethod(object, name, value) {
  maybeDefine(object, name, {
    value: value,
    configurable: true,
    enumerable: false,
    writable: true
  });
}
function maybeDefineConst(object, name, value) {
  maybeDefine(object, name, {
    value: value,
    configurable: false,
    enumerable: false,
    writable: false
  });
}
function maybeAddFunctions(object, functions) {
  for (var i = 0; i < functions.length; i += 2) {
    var name = functions[i];
    var value = functions[i + 1];
    maybeDefineMethod(object, name, value);
  }
}
function maybeAddConsts(object, consts) {
  for (var i = 0; i < consts.length; i += 2) {
    var name = consts[i];
    var value = consts[i + 1];
    maybeDefineConst(object, name, value);
  }
}
function maybeAddIterator(object, func, Symbol) {
  if (!Symbol || !Symbol.iterator || object[Symbol.iterator])
    return;
  if (object['@@iterator'])
    func = object['@@iterator'];
  Object.defineProperty(object, Symbol.iterator, {
    value: func,
    configurable: true,
    enumerable: false,
    writable: true
  });
}
var polyfills = [];
function registerPolyfill(func) {
  polyfills.push(func);
}
function polyfillAll(global) {
  polyfills.forEach(function(f) {
    return f(global);
  });
}
