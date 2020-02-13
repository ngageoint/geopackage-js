"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  default: {
    enumerable: true,
    get: function() {
      return alphaRenameThisAndArguments;
    }
  }
});
var $__0 = require("../syntax/PredefinedName.js"),
    ARGUMENTS = $__0.ARGUMENTS,
    THIS = $__0.THIS;
var AlphaRenamer = require("./AlphaRenamer.js").AlphaRenamer;
var FindThisOrArguments = require("./FindThisOrArguments.js").FindThisOrArguments;
function alphaRenameThisAndArguments(tempVarTransformer, tree) {
  var finder = new FindThisOrArguments();
  finder.visitAny(tree);
  if (finder.foundArguments) {
    var argumentsTempName = tempVarTransformer.addTempVarForArguments();
    tree = AlphaRenamer.rename(tree, ARGUMENTS, argumentsTempName);
  }
  if (finder.foundThis) {
    var thisTempName = tempVarTransformer.addTempVarForThis();
    tree = AlphaRenamer.rename(tree, THIS, thisTempName);
  }
  return tree;
}
