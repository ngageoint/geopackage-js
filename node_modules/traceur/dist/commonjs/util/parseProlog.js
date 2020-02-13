"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return parseProlog;
    }
  }
});
var CommandOptions = require("../Options.js").CommandOptions;
function forEachPrologLine(s, f) {
  var inProlog = true;
  for (var i = 0; inProlog && i < s.length; ) {
    var j = s.indexOf('\n', i);
    if (j == -1)
      break;
    if (s[i] === '/' && s[i + 1] === '/') {
      var line = s.slice(i, j);
      f(line);
      i = j + 1;
    } else {
      inProlog = false;
    }
  }
}
function parseProlog(source) {
  var returnValue = {
    onlyInBrowser: false,
    skip: false,
    get shouldHaveErrors() {
      return this.expectedErrors.length !== 0;
    },
    expectedErrors: [],
    async: false
  };
  forEachPrologLine(source, function(line) {
    var m;
    if (line.indexOf('// Only in browser.') === 0) {
      returnValue.onlyInBrowser = true;
    } else if (line.indexOf('// Skip') === 0) {
      if (line.indexOf('// Skip.') === 0) {
        returnValue.skip = true;
      } else {
        var skip = false;
        try {
          skip = eval(line.slice('// Skip'.length));
        } catch (ex) {
          skip = true;
        }
        returnValue.skip = !!skip;
      }
    } else if (line.indexOf('// Async.') === 0) {
      returnValue.async = true;
    } else if ((m = /\/\ Options:\s*(.+)/.exec(line))) {
      returnValue.traceurOptions = traceur.util.CommandOptions.fromString(m[1]);
    } else if ((m = /\/\/ Error:\s*(.+)/.exec(line))) {
      returnValue.expectedErrors.push(m[1]);
    }
  });
  return returnValue;
}
