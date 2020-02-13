"use strict";
function $__interopRequire(id) {
  id = require(id);
  return id && id.__esModule && id || {default: id};
}
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  RestParameterTransformer: {
    enumerable: true,
    get: function() {
      return RestParameterTransformer;
    }
  }
});
var $__superConstructor = $__interopRequire("traceur/dist/commonjs/runtime/modules/superConstructor.js").default;
var $__createClass = $__interopRequire("traceur/dist/commonjs/runtime/modules/createClass.js").default;
var $__superGet = $__interopRequire("traceur/dist/commonjs/runtime/modules/superGet.js").default;
var $__getTemplateObject = $__interopRequire("traceur/dist/commonjs/runtime/modules/getTemplateObject.js").default;
var FormalParameterList = require("../syntax/trees/ParseTrees.js").FormalParameterList;
var ParameterTransformer = require("./ParameterTransformer.js").ParameterTransformer;
var createIdentifierToken = require("./ParseTreeFactory.js").createIdentifierToken;
var parseStatement = require("./PlaceholderParser.js").parseStatement;
function hasRestParameter(parameterList) {
  var parameters = parameterList.parameters;
  return parameters.length > 0 && parameters[parameters.length - 1].isRestParameter();
}
function getRestParameterLiteralToken(parameterList) {
  var parameters = parameterList.parameters;
  return parameters[parameters.length - 1].parameter.identifier.identifierToken;
}
var RestParameterTransformer = function($__super) {
  function RestParameterTransformer() {
    $__superConstructor(RestParameterTransformer).apply(this, arguments);
  }
  return ($__createClass)(RestParameterTransformer, {transformFormalParameterList: function(tree) {
      var transformed = $__superGet(this, RestParameterTransformer.prototype, "transformFormalParameterList").call(this, tree);
      if (hasRestParameter(transformed)) {
        var parametersWithoutRestParam = new FormalParameterList(transformed.location, transformed.parameters.slice(0, -1));
        var startIndex = transformed.parameters.length - 1;
        var i = createIdentifierToken(this.getTempIdentifier());
        var name = getRestParameterLiteralToken(transformed);
        var loop;
        if (startIndex) {
          loop = parseStatement($__getTemplateObject(["\n            for (var ", " = [], ", " = ", ";\n                 ", " < arguments.length; ", "++)\n              ", "[", " - ", "] = arguments[", "];"]), name, i, startIndex, i, i, name, i, startIndex, i);
        } else {
          loop = parseStatement($__getTemplateObject(["\n            for (var ", " = [], ", " = 0;\n                 ", " < arguments.length; ", "++)\n              ", "[", "] = arguments[", "];"]), name, i, i, i, name, i, i);
        }
        this.parameterStatements.push(loop);
        return parametersWithoutRestParam;
      }
      return transformed;
    }}, {}, $__super);
}(ParameterTransformer);
