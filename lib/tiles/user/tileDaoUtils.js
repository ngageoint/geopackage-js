
module.exports.adjustTileMatrixLengths = function(tileMatrixSet, tileMatrices) {
  var tileMatrixWidth = tileMatrixSet.maxX - tileMatrixSet.minX;
  var tileMatrixHeight = tileMatrixSet.maxY - tileMatrixSet.minY;
  for (var i = 0; i < tileMatrices.length; i++) {
    var tileMatrix = tileMatrices[i];
    var tempMatrixWidth = ~~((tileMatrixWidth / (tileMatrix.pixelXSize * ~~tileMatrix.tileWidth)));
    var tempMatrixHeight = ~~((tileMatrixHeight / (tileMatrix.pixelYSize * ~~(tileMatrix.tileHeight))));
    if(tempMatrixWidth > ~~(tileMatrix.matrixWidth)) {
      tileMatrix.matrixWidth = ~~(tempMatrixWidth);
    }
    if (tempMatrixHeight > ~~(tileMatrix.matrixHeight)) {
      tileMatrix.matrixHeight = ~~(tempMatrixHeight);
    }
  }
}
