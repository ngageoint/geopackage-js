"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  initAsyncGeneratorFunction: {
    enumerable: true,
    get: function() {
      return initAsyncGeneratorFunction;
    }
  },
  createAsyncGeneratorInstance: {
    enumerable: true,
    get: function() {
      return createAsyncGeneratorInstance;
    }
  },
  observeForEach: {
    enumerable: true,
    get: function() {
      return observeForEach;
    }
  },
  schedule: {
    enumerable: true,
    get: function() {
      return schedule;
    }
  },
  createDecoratedGenerator: {
    enumerable: true,
    get: function() {
      return createDecoratedGenerator;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__13 = require("../private.js"),
    createPrivateSymbol = $__13.createPrivateSymbol,
    getPrivate = $__13.getPrivate,
    setPrivate = $__13.setPrivate;
var $__11 = Object,
    create = $__11.create,
    defineProperty = $__11.defineProperty;
var observeName = createPrivateSymbol();
function AsyncGeneratorFunction() {}
function AsyncGeneratorFunctionPrototype() {}
AsyncGeneratorFunction.prototype = AsyncGeneratorFunctionPrototype;
AsyncGeneratorFunctionPrototype.constructor = AsyncGeneratorFunction;
defineProperty(AsyncGeneratorFunctionPrototype, 'constructor', {enumerable: false});
var AsyncGeneratorContext = function() {
  function AsyncGeneratorContext(observer) {
    var $__2 = this;
    this.decoratedObserver = createDecoratedGenerator(observer, function() {
      $__2.done = true;
    });
    this.done = false;
    this.inReturn = false;
  }
  return ($__createClass)(AsyncGeneratorContext, {
    throw: function(error) {
      if (!this.inReturn) {
        throw error;
      }
    },
    yield: function(value) {
      if (this.done) {
        this.inReturn = true;
        throw undefined;
      }
      var result;
      try {
        result = this.decoratedObserver.next(value);
      } catch (e) {
        this.done = true;
        throw e;
      }
      if (result === undefined) {
        return;
      }
      if (result.done) {
        this.done = true;
        this.inReturn = true;
        throw undefined;
      }
      return result.value;
    },
    yieldFor: function(observable) {
      var ctx = this;
      return observeForEach(observable[Symbol.observer].bind(observable), function(value) {
        if (ctx.done) {
          this.return();
          return;
        }
        var result;
        try {
          result = ctx.decoratedObserver.next(value);
        } catch (e) {
          ctx.done = true;
          throw e;
        }
        if (result === undefined) {
          return;
        }
        if (result.done) {
          ctx.done = true;
        }
        return result;
      });
    }
  }, {});
}();
AsyncGeneratorFunctionPrototype.prototype[Symbol.observer] = function(observer) {
  var observe = getPrivate(this, observeName);
  var ctx = new AsyncGeneratorContext(observer);
  schedule(function() {
    return observe(ctx);
  }).then(function(value) {
    if (!ctx.done) {
      ctx.decoratedObserver.return(value);
    }
  }).catch(function(error) {
    if (!ctx.done) {
      ctx.decoratedObserver.throw(error);
    }
  });
  return ctx.decoratedObserver;
};
defineProperty(AsyncGeneratorFunctionPrototype.prototype, Symbol.observer, {enumerable: false});
function initAsyncGeneratorFunction(functionObject) {
  functionObject.prototype = create(AsyncGeneratorFunctionPrototype.prototype);
  functionObject.__proto__ = AsyncGeneratorFunctionPrototype;
  return functionObject;
}
function createAsyncGeneratorInstance(observe, functionObject) {
  for (var args = [],
      $__10 = 2; $__10 < arguments.length; $__10++)
    args[$__10 - 2] = arguments[$__10];
  var object = create(functionObject.prototype);
  setPrivate(object, observeName, observe);
  return object;
}
function observeForEach(observe, next) {
  return new Promise(function(resolve, reject) {
    var generator = observe({
      next: function(value) {
        return next.call(generator, value);
      },
      throw: function(error) {
        reject(error);
      },
      return: function(value) {
        resolve(value);
      }
    });
  });
}
function schedule(asyncF) {
  return Promise.resolve().then(asyncF);
}
var generator = Symbol();
var onDone = Symbol();
var DecoratedGenerator = function() {
  function DecoratedGenerator(_generator, _onDone) {
    this[generator] = _generator;
    this[onDone] = _onDone;
  }
  return ($__createClass)(DecoratedGenerator, {
    next: function(value) {
      var result = this[generator].next(value);
      if (result !== undefined && result.done) {
        this[onDone].call(this);
      }
      return result;
    },
    throw: function(error) {
      this[onDone].call(this);
      return this[generator].throw(error);
    },
    return: function(value) {
      this[onDone].call(this);
      return this[generator].return(value);
    }
  }, {});
}();
function createDecoratedGenerator(generator, onDone) {
  return new DecoratedGenerator(generator, onDone);
}
Array.prototype[Symbol.observer] = function(observer) {
  var done = false;
  var decoratedObserver = createDecoratedGenerator(observer, function() {
    return done = true;
  });
  var $__6 = true;
  var $__7 = false;
  var $__8 = undefined;
  try {
    for (var $__4 = void 0,
        $__3 = (this)[Symbol.iterator](); !($__6 = ($__4 = $__3.next()).done); $__6 = true) {
      var value = $__4.value;
      {
        decoratedObserver.next(value);
        if (done) {
          return;
        }
      }
    }
  } catch ($__9) {
    $__7 = true;
    $__8 = $__9;
  } finally {
    try {
      if (!$__6 && $__3.return != null) {
        $__3.return();
      }
    } finally {
      if ($__7) {
        throw $__8;
      }
    }
  }
  decoratedObserver.return();
  return decoratedObserver;
};
defineProperty(Array.prototype, Symbol.observer, {enumerable: false});
