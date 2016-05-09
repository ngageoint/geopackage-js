
module.exports.adjustTileMatrixLengths = function(tileMatrixSet, tileMatrices) {
  var tileMatrixWidth = tileMatrixSet.maxX - tileMatrixSet.minX;
  var tileMatrixHeight = tileMatrixSet.maxY - tileMatrixSet.minY;
  for (var i = 0; i < tileMatrices.length; i++) {
    var tileMatrix = tileMatrices[i];
    var tempMatrixWidth = parseInt((tileMatrixWidth / (tileMatrix.pixelXSize * parseInt(tileMatrix.tileWidth))));
    var tempMatrixHeight = parseInt((tileMatrixHeight / (tileMatrix.pixelYSize * parseInt(tileMatrix.tileHeight))));
    if(tempMatrixWidth > parseInt(tileMatrix.matrixWidth)) {
      tileMatrix.matrixWidth = parseInt(tempMatrixWidth);
    }
    if (tempMatrixHeight > parseInt(tileMatrix.matrixHeight)) {
      tileMatrix.matrixHeight = parseInt(tempMatrixHeight);
    }
  }
}
