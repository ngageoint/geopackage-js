"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
var initTailRecursiveFunction = $__interopRequire("./modules/initTailRecursiveFunction.js").default;
var call = $__interopRequire("./modules/call.js").default;
var continuation = $__interopRequire("./modules/continuation.js").default;
var construct = $__interopRequire("./modules/construct.js").default;
$traceurRuntime.initTailRecursiveFunction = initTailRecursiveFunction;
$traceurRuntime.call = call;
$traceurRuntime.continuation = continuation;
$traceurRuntime.construct = construct;
