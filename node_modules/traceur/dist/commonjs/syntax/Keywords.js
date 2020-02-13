"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  NORMAL_KEYWORD: {
    enumerable: true,
    get: function() {
      return NORMAL_KEYWORD;
    }
  },
  STRICT_KEYWORD: {
    enumerable: true,
    get: function() {
      return STRICT_KEYWORD;
    }
  },
  getKeywordType: {
    enumerable: true,
    get: function() {
      return getKeywordType;
    }
  },
  isStrictKeyword: {
    enumerable: true,
    get: function() {
      return isStrictKeyword;
    }
  }
});
var keywords = ['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'enum', 'extends', 'null', 'true', 'false'];
var strictKeywords = ['implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield'];
var keywordsByName = Object.create(null);
var NORMAL_KEYWORD = 1;
var STRICT_KEYWORD = 2;
keywords.forEach(function(value) {
  keywordsByName[value] = NORMAL_KEYWORD;
});
strictKeywords.forEach(function(value) {
  keywordsByName[value] = STRICT_KEYWORD;
});
function getKeywordType(value) {
  return keywordsByName[value];
}
function isStrictKeyword(value) {
  return getKeywordType(value) === STRICT_KEYWORD;
}
