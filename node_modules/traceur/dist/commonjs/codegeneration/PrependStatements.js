"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  prependStatements: {
    enumerable: true,
    get: function() {
      return prependStatements;
    }
  }
});
var $__spread = $__interopRequire("traceur/dist/commonjs/runtime/modules/spread.js").default;
function prependStatements(statements) {
  var $__1;
  for (var statementsToPrepend = [],
      $__0 = 1; $__0 < arguments.length; $__0++)
    statementsToPrepend[$__0 - 1] = arguments[$__0];
  if (!statements.length)
    return statementsToPrepend;
  if (!statementsToPrepend.length)
    return statements;
  var transformed = [];
  var inProlog = true;
  statements.forEach(function(statement) {
    var $__1;
    if (inProlog && !statement.isDirectivePrologue()) {
      ($__1 = transformed).push.apply($__1, $__spread(statementsToPrepend));
      inProlog = false;
    }
    transformed.push(statement);
  });
  if (inProlog) {
    ($__1 = transformed).push.apply($__1, $__spread(statementsToPrepend));
  }
  return transformed;
}
