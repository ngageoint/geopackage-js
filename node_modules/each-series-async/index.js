/*!
 * each-series-async <https://github.com/jonschlinkert/each-series-async>
 *
 * Copyright (c) 2017, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

module.exports = function each(arr, next, cb) {
  if (typeof cb !== 'function') {
    throw new TypeError('expected callback to be a function');
  }

  if (typeof next !== 'function') {
    cb(new TypeError('expected iteratee to be a function'));
    return;
  }

  if (!Array.isArray(arr)) {
    cb(new TypeError('expected first argument to be an array'));
    return;
  }

  var len = arr.length;

  (function invoke(i) {
    if (i === len) {
      cb();
      return;
    }
    next(arr[i], function(err) {
      if (err) {
        cb(err);
        return;
      }
      invoke(i + 1);
    });
  })(0);
};
