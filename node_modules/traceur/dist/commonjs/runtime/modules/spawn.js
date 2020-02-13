"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return spawn;
    }
  }
});
function spawn(self, args, gen) {
  return new Promise(function(resolve, reject) {
    function fulfill(v) {
      try {
        step(gen.next(v));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(v) {
      try {
        step(gen.throw(v));
      } catch (e) {
        reject(e);
      }
    }
    function step(res) {
      if (res.done) {
        resolve(res.value);
      } else {
        Promise.resolve(res.value).then(fulfill, rejected);
      }
    }
    step((gen = gen.apply(self, args)).next());
  });
}
