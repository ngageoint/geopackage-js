
module.exports.adjustTileMatrixLengths = function(tileMatrixSet, tileMatrices) {
  var tileMatrixWidth = tileMatrixSet.maxX - tileMatrixSet.minX;
  var tileMatrixHeight = tileMatrixSet.maxY - tileMatrixSet.minY;
  for (var i = 0; i < tileMatrices.length; i++) {
    var tileMatrix = tileMatrices[i];
    var tempMatrixWidth = (tileMatrixWidth / (tileMatrix.pixelXSize * tileMatrix.tileWidth));
    var tempMatrixHeight = (tileMatrixHeight / (tileMatrix.pixelYSize * tileMatrix.tileHeight));
    if(tempMatrixWidth > tileMatrix.matrixWidth) {
      tileMatrix.matrixWidth = tempMatrixWidth;
    }
    if (tempMatrixHeight > tileMatrix.matrixHeight) {
      tileMatrix.matrixHeight = tempMatrixHeight;
    }
  }
}

module.exports.getZoomLevel = function(widths, heights, tileMatrices, length) {
  console.log('arguments', arguments);
  var zoomLevel;
  var widthIndex;
  var heightIndex;
  for (var i = 0; i < widths.length; i++) {
    if(widths[i] > length) {
      widthIndex = i;
      break;
    }
  }

  for (var i = 0; i < heights.length; i++) {
    if(heights[i] > length) {
      heightIndex = i;
      break;
    }
  }

  // Find the closest width or verify it isn't too small or large
  if (widthIndex === 0) {
    if(length < widths[widthIndex] * .51) {
      widthIndex = -1;
    }
  } else if (widthIndex === widths.length) {
    if (length >= widths[widthIndex-1]/.51) {
      widthIndex = -1;
    } else {
      widthIndex = widthIndex - 1;
    }
  } else if ((length - widths[widthIndex - 1]) < (widths[widthIndex] - length) ) {
    widthIndex--;
  }

  // Find the closest height or verify it isn't too small or large
  if (heightIndex === 0) {
    if(length < widths[heightIndex] * .51) {
      heightIndex = -1;
    }
  } else if (heightIndex === heights.length) {
    if (length >= heights[heightIndex-1]/.51) {
      heightIndex = -1;
    } else {
      heightIndex = heightIndex - 1;
    }
  } else if ((length - heights[heightIndex - 1]) < (heights[heightIndex] - length) ) {
    heightIndex--;
  }

  if (widthIndex >= 0 && heightIndex >= 0) {
    // use one zoom size smaller if possible
    var index = widthIndex < heightIndex ? widthIndex : heightIndex;
    if (index >= 0) {
      var tileMatrix = tileMatrices[tileMatrices.length - index - 1];
      zoomLevel = tileMatrix.zoomLevel;
    }
  }
  return zoomLevel;
}
