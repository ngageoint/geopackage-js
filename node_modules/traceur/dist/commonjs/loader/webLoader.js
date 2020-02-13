"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  webLoader: {
    enumerable: true,
    get: function() {
      return webLoader;
    }
  }
});
var webLoader = {load: function(url, callback, errback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status == 200 || xhr.status == 0) {
        callback(xhr.responseText);
      } else {
        var err;
        if (xhr.status === 404)
          err = 'File not found \'' + url + '\'';
        else
          err = xhr.status + xhr.statusText;
        errback(err);
      }
      xhr = null;
    };
    xhr.onerror = function(err) {
      errback(err);
    };
    xhr.open('GET', url, true);
    xhr.send();
    return function() {
      xhr && xhr.abort();
    };
  }};
