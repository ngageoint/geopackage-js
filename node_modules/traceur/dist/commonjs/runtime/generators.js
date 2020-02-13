"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
var asyncWrap = $__interopRequire("./modules/asyncWrap.js").default;
var initGeneratorFunction = $__interopRequire("./modules/initGeneratorFunction.js").default;
var createGeneratorInstance = $__interopRequire("./modules/createGeneratorInstance.js").default;
$traceurRuntime.asyncWrap = asyncWrap;
$traceurRuntime.initGeneratorFunction = initGeneratorFunction;
$traceurRuntime.createGeneratorInstance = createGeneratorInstance;
