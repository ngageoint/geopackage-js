"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  startsWith: {
    enumerable: true,
    get: function() {
      return startsWith;
    }
  },
  endsWith: {
    enumerable: true,
    get: function() {
      return endsWith;
    }
  },
  includes: {
    enumerable: true,
    get: function() {
      return includes;
    }
  },
  repeat: {
    enumerable: true,
    get: function() {
      return repeat;
    }
  },
  codePointAt: {
    enumerable: true,
    get: function() {
      return codePointAt;
    }
  },
  raw: {
    enumerable: true,
    get: function() {
      return raw;
    }
  },
  fromCodePoint: {
    enumerable: true,
    get: function() {
      return fromCodePoint;
    }
  },
  stringPrototypeIterator: {
    enumerable: true,
    get: function() {
      return stringPrototypeIterator;
    }
  },
  polyfillString: {
    enumerable: true,
    get: function() {
      return polyfillString;
    }
  }
});
var checkObjectCoercible = $__interopRequire("../checkObjectCoercible.js").default;
var createStringIterator = require("./StringIterator.js").createStringIterator;
var $__3 = require("./utils.js"),
    maybeAddFunctions = $__3.maybeAddFunctions,
    maybeAddIterator = $__3.maybeAddIterator,
    registerPolyfill = $__3.registerPolyfill;
var $toString = Object.prototype.toString;
var $indexOf = String.prototype.indexOf;
var $lastIndexOf = String.prototype.lastIndexOf;
function startsWith(search) {
  var string = String(this);
  if (this == null || $toString.call(search) == '[object RegExp]') {
    throw TypeError();
  }
  var stringLength = string.length;
  var searchString = String(search);
  var searchLength = searchString.length;
  var position = arguments.length > 1 ? arguments[1] : undefined;
  var pos = position ? Number(position) : 0;
  if (isNaN(pos)) {
    pos = 0;
  }
  var start = Math.min(Math.max(pos, 0), stringLength);
  return $indexOf.call(string, searchString, pos) == start;
}
function endsWith(search) {
  var string = String(this);
  if (this == null || $toString.call(search) == '[object RegExp]') {
    throw TypeError();
  }
  var stringLength = string.length;
  var searchString = String(search);
  var searchLength = searchString.length;
  var pos = stringLength;
  if (arguments.length > 1) {
    var position = arguments[1];
    if (position !== undefined) {
      pos = position ? Number(position) : 0;
      if (isNaN(pos)) {
        pos = 0;
      }
    }
  }
  var end = Math.min(Math.max(pos, 0), stringLength);
  var start = end - searchLength;
  if (start < 0) {
    return false;
  }
  return $lastIndexOf.call(string, searchString, start) == start;
}
function includes(search) {
  if (this == null) {
    throw TypeError();
  }
  var string = String(this);
  if (search && $toString.call(search) == '[object RegExp]') {
    throw TypeError();
  }
  var stringLength = string.length;
  var searchString = String(search);
  var searchLength = searchString.length;
  var position = arguments.length > 1 ? arguments[1] : undefined;
  var pos = position ? Number(position) : 0;
  if (pos != pos) {
    pos = 0;
  }
  var start = Math.min(Math.max(pos, 0), stringLength);
  if (searchLength + start > stringLength) {
    return false;
  }
  return $indexOf.call(string, searchString, pos) != -1;
}
function repeat(count) {
  if (this == null) {
    throw TypeError();
  }
  var string = String(this);
  var n = count ? Number(count) : 0;
  if (isNaN(n)) {
    n = 0;
  }
  if (n < 0 || n == Infinity) {
    throw RangeError();
  }
  if (n == 0) {
    return '';
  }
  var result = '';
  while (n--) {
    result += string;
  }
  return result;
}
function codePointAt(position) {
  if (this == null) {
    throw TypeError();
  }
  var string = String(this);
  var size = string.length;
  var index = position ? Number(position) : 0;
  if (isNaN(index)) {
    index = 0;
  }
  if (index < 0 || index >= size) {
    return undefined;
  }
  var first = string.charCodeAt(index);
  var second;
  if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
    second = string.charCodeAt(index + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) {
      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
    }
  }
  return first;
}
function raw(callsite) {
  var raw = callsite.raw;
  var len = raw.length >>> 0;
  if (len === 0)
    return '';
  var s = '';
  var i = 0;
  while (true) {
    s += raw[i];
    if (i + 1 === len)
      return s;
    s += arguments[++i];
  }
}
function fromCodePoint(_) {
  var codeUnits = [];
  var floor = Math.floor;
  var highSurrogate;
  var lowSurrogate;
  var index = -1;
  var length = arguments.length;
  if (!length) {
    return '';
  }
  while (++index < length) {
    var codePoint = Number(arguments[index]);
    if (!isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF || floor(codePoint) != codePoint) {
      throw RangeError('Invalid code point: ' + codePoint);
    }
    if (codePoint <= 0xFFFF) {
      codeUnits.push(codePoint);
    } else {
      codePoint -= 0x10000;
      highSurrogate = (codePoint >> 10) + 0xD800;
      lowSurrogate = (codePoint % 0x400) + 0xDC00;
      codeUnits.push(highSurrogate, lowSurrogate);
    }
  }
  return String.fromCharCode.apply(null, codeUnits);
}
function stringPrototypeIterator() {
  var o = checkObjectCoercible(this);
  var s = String(o);
  return createStringIterator(s);
}
function polyfillString(global) {
  var String = global.String;
  maybeAddFunctions(String.prototype, ['codePointAt', codePointAt, 'endsWith', endsWith, 'includes', includes, 'repeat', repeat, 'startsWith', startsWith]);
  maybeAddFunctions(String, ['fromCodePoint', fromCodePoint, 'raw', raw]);
  maybeAddIterator(String.prototype, stringPrototypeIterator, Symbol);
}
registerPolyfill(polyfillString);
