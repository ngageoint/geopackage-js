"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  Promise: {
    enumerable: true,
    get: function() {
      return Promise;
    }
  },
  polyfillPromise: {
    enumerable: true,
    get: function() {
      return polyfillPromise;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var async = $__interopRequire("../../../node_modules/rsvp/lib/rsvp/asap.js").default;
var $__10 = require("./utils.js"),
    isObject = $__10.isObject,
    registerPolyfill = $__10.registerPolyfill;
var $__11 = require("../private.js"),
    createPrivateSymbol = $__11.createPrivateSymbol,
    getPrivate = $__11.getPrivate,
    setPrivate = $__11.setPrivate;
var promiseRaw = {};
function isPromise(x) {
  return x && typeof x === 'object' && x.status_ !== undefined;
}
function idResolveHandler(x) {
  return x;
}
function idRejectHandler(x) {
  throw x;
}
function chain(promise) {
  var onResolve = arguments[1] !== (void 0) ? arguments[1] : idResolveHandler;
  var onReject = arguments[2] !== (void 0) ? arguments[2] : idRejectHandler;
  var deferred = getDeferred(promise.constructor);
  switch (promise.status_) {
    case undefined:
      throw TypeError;
    case 0:
      promise.onResolve_.push(onResolve, deferred);
      promise.onReject_.push(onReject, deferred);
      break;
    case +1:
      promiseEnqueue(promise.value_, [onResolve, deferred]);
      break;
    case -1:
      promiseEnqueue(promise.value_, [onReject, deferred]);
      break;
  }
  return deferred.promise;
}
function getDeferred(C) {
  if (this === $Promise) {
    var promise = promiseInit(new $Promise(promiseRaw));
    return {
      promise: promise,
      resolve: function(x) {
        promiseResolve(promise, x);
      },
      reject: function(r) {
        promiseReject(promise, r);
      }
    };
  } else {
    var result = {};
    result.promise = new C(function(resolve, reject) {
      result.resolve = resolve;
      result.reject = reject;
    });
    return result;
  }
}
function promiseSet(promise, status, value, onResolve, onReject) {
  promise.status_ = status;
  promise.value_ = value;
  promise.onResolve_ = onResolve;
  promise.onReject_ = onReject;
  return promise;
}
function promiseInit(promise) {
  return promiseSet(promise, 0, undefined, [], []);
}
var Promise = function() {
  function Promise(resolver) {
    if (resolver === promiseRaw)
      return;
    if (typeof resolver !== 'function')
      throw new TypeError;
    var promise = promiseInit(this);
    try {
      resolver(function(x) {
        promiseResolve(promise, x);
      }, function(r) {
        promiseReject(promise, r);
      });
    } catch (e) {
      promiseReject(promise, e);
    }
  }
  return ($__createClass)(Promise, {
    catch: function(onReject) {
      return this.then(undefined, onReject);
    },
    then: function(onResolve, onReject) {
      if (typeof onResolve !== 'function')
        onResolve = idResolveHandler;
      if (typeof onReject !== 'function')
        onReject = idRejectHandler;
      var that = this;
      var constructor = this.constructor;
      return chain(this, function(x) {
        x = promiseCoerce(constructor, x);
        return x === that ? onReject(new TypeError) : isPromise(x) ? x.then(onResolve, onReject) : onResolve(x);
      }, onReject);
    }
  }, {
    resolve: function(x) {
      if (this === $Promise) {
        if (isPromise(x)) {
          return x;
        }
        return promiseSet(new $Promise(promiseRaw), +1, x);
      } else {
        return new this(function(resolve, reject) {
          resolve(x);
        });
      }
    },
    reject: function(r) {
      if (this === $Promise) {
        return promiseSet(new $Promise(promiseRaw), -1, r);
      } else {
        return new this(function(resolve, reject) {
          reject(r);
        });
      }
    },
    all: function(values) {
      var deferred = getDeferred(this);
      var resolutions = [];
      try {
        var makeCountdownFunction = function(i) {
          return function(x) {
            resolutions[i] = x;
            if (--count === 0)
              deferred.resolve(resolutions);
          };
        };
        var count = 0;
        var i = 0;
        var $__4 = true;
        var $__5 = false;
        var $__6 = undefined;
        try {
          for (var $__2 = void 0,
              $__1 = (values)[Symbol.iterator](); !($__4 = ($__2 = $__1.next()).done); $__4 = true) {
            var value = $__2.value;
            {
              var countdownFunction = makeCountdownFunction(i);
              this.resolve(value).then(countdownFunction, function(r) {
                deferred.reject(r);
              });
              ++i;
              ++count;
            }
          }
        } catch ($__7) {
          $__5 = true;
          $__6 = $__7;
        } finally {
          try {
            if (!$__4 && $__1.return != null) {
              $__1.return();
            }
          } finally {
            if ($__5) {
              throw $__6;
            }
          }
        }
        if (count === 0) {
          deferred.resolve(resolutions);
        }
      } catch (e) {
        deferred.reject(e);
      }
      return deferred.promise;
    },
    race: function(values) {
      var deferred = getDeferred(this);
      try {
        for (var i = 0; i < values.length; i++) {
          this.resolve(values[i]).then(function(x) {
            deferred.resolve(x);
          }, function(r) {
            deferred.reject(r);
          });
        }
      } catch (e) {
        deferred.reject(e);
      }
      return deferred.promise;
    }
  });
}();
var $Promise = Promise;
var $PromiseReject = $Promise.reject;
function promiseResolve(promise, x) {
  promiseDone(promise, +1, x, promise.onResolve_);
}
function promiseReject(promise, r) {
  promiseDone(promise, -1, r, promise.onReject_);
}
function promiseDone(promise, status, value, reactions) {
  if (promise.status_ !== 0)
    return;
  promiseEnqueue(value, reactions);
  promiseSet(promise, status, value);
}
function promiseEnqueue(value, tasks) {
  async(function() {
    for (var i = 0; i < tasks.length; i += 2) {
      promiseHandle(value, tasks[i], tasks[i + 1]);
    }
  });
}
function promiseHandle(value, handler, deferred) {
  try {
    var result = handler(value);
    if (result === deferred.promise)
      throw new TypeError;
    else if (isPromise(result))
      chain(result, deferred.resolve, deferred.reject);
    else
      deferred.resolve(result);
  } catch (e) {
    try {
      deferred.reject(e);
    } catch (e) {}
  }
}
var thenableSymbol = createPrivateSymbol();
function promiseCoerce(constructor, x) {
  if (!isPromise(x) && isObject(x)) {
    var then;
    try {
      then = x.then;
    } catch (r) {
      var promise = $PromiseReject.call(constructor, r);
      setPrivate(x, thenableSymbol, promise);
      return promise;
    }
    if (typeof then === 'function') {
      var p = getPrivate(x, thenableSymbol);
      if (p) {
        return p;
      } else {
        var deferred = getDeferred(constructor);
        setPrivate(x, thenableSymbol, deferred.promise);
        try {
          then.call(x, deferred.resolve, deferred.reject);
        } catch (r) {
          deferred.reject(r);
        }
        return deferred.promise;
      }
    }
  }
  return x;
}
function polyfillPromise(global) {
  if (!global.Promise)
    global.Promise = Promise;
}
registerPolyfill(polyfillPromise);
