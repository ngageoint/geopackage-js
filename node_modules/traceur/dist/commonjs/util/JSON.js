"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  transform: {
    enumerable: true,
    get: function() {
      return transform;
    }
  }
});
function transform(v) {
  var replacer = arguments[1] !== (void 0) ? arguments[1] : function(k, v) {
    return v;
  };
  return transform_(replacer('', v), replacer);
}
function transform_(v, replacer) {
  var rv,
      tv;
  if (Array.isArray(v)) {
    var len = v.length;
    rv = Array(len);
    for (var i = 0; i < len; i++) {
      tv = transform_(replacer(String(i), v[i]), replacer);
      rv[i] = tv === undefined ? null : tv;
    }
    return rv;
  }
  if (v instanceof Object) {
    rv = {};
    Object.keys(v).forEach(function(k) {
      tv = transform_(replacer(k, v[k]), replacer);
      if (tv !== undefined) {
        rv[k] = tv;
      }
    });
    return rv;
  }
  return v;
}
