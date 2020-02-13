"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
var initAsyncGeneratorFunction = $__interopRequire("./modules/initAsyncGeneratorFunction.js").default;
var createAsyncGeneratorInstance = $__interopRequire("./modules/createAsyncGeneratorInstance.js").default;
var observeForEach = $__interopRequire("./modules/observeForEach.js").default;
var schedule = $__interopRequire("./modules/schedule.js").default;
var createDecoratedGenerator = $__interopRequire("./modules/createDecoratedGenerator.js").default;
$traceurRuntime.initAsyncGeneratorFunction = initAsyncGeneratorFunction;
$traceurRuntime.createAsyncGeneratorInstance = createAsyncGeneratorInstance;
$traceurRuntime.observeForEach = observeForEach;
$traceurRuntime.schedule = schedule;
$traceurRuntime.createDecoratedGenerator = createDecoratedGenerator;
