module.exports.initialize = function(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas) {
  var isElectron = !!(typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);
  // @ts-ignore
  var isPhantom = !!(typeof window !== 'undefined' && window.callPhantom && window._phantom);
  var isNode = typeof(process) !== 'undefined' && process.version;
  if (isNode && !isPhantom && !isElectron) {
    var NodeTileCreator = require('./node');
    return new NodeTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas);
  } else {
    var CanvasTileCreator = require('./canvas');
    return new CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas);
  }
};