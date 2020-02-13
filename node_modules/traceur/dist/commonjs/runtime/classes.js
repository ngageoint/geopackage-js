"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
var createClass = $__interopRequire("./modules/createClass.js").default;
var superConstructor = $__interopRequire("./modules/superConstructor.js").default;
var superGet = $__interopRequire("./modules/superGet.js").default;
var superSet = $__interopRequire("./modules/superSet.js").default;
$traceurRuntime.createClass = createClass;
$traceurRuntime.superConstructor = superConstructor;
$traceurRuntime.superGet = superGet;
$traceurRuntime.superSet = superSet;
