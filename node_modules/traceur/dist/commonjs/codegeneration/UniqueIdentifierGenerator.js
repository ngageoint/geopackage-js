"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  UniqueIdentifierGenerator: {
    enumerable: true,
    get: function() {
      return UniqueIdentifierGenerator;
    }
  }
});
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var UniqueIdentifierGenerator = function() {
  function UniqueIdentifierGenerator() {
    this.identifierIndex = 0;
  }
  return ($__createClass)(UniqueIdentifierGenerator, {generateUniqueIdentifier: function() {
      return ("$__" + this.identifierIndex++);
    }}, {});
}();
