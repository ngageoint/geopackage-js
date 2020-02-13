"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
var traceur = $__interopRequire("./traceur.js");
Reflect.global.traceur = traceur;
$traceurRuntime.ModuleStore.set('traceur@', traceur);
