export async function initialize(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas) {
  var isElectron = !!(typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);
  // @ts-ignore
  var isPhantom = !!(typeof window !== 'undefined' && window.callPhantom && window._phantom);
  var isNode = typeof(process) !== 'undefined' && process.version;
  if (isNode && !isPhantom && !isElectron) {
    var NodeTileCreator = require('./node').NodeTileCreator;
    var creator = new NodeTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas);
    await creator.initialize();
    return creator;
  } else {
    var CanvasTileCreator = require('./canvas').CanvasTileCreator;
    var canvasCreator = new CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas);
    await canvasCreator.initialize();
    return canvasCreator;
  }
};