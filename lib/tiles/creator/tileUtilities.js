var proj4 = require('proj4');

module.exports.getPiecePosition = function(tilePieceBoundingBox, tileBoundingBox, height, width, projectionTo, projectionFrom, tileHeightUnitsPerPixel, tileWidthUnitsPerPixel, pixelXSize, pixelYSize) {
  var conversion = proj4(projectionTo, projectionFrom);

  var maxLatitude;
  var minLatitude;

  if (projectionTo.toUpperCase() === 'EPSG:3857' && projectionFrom.toUpperCase() === 'EPSG:4326') {
    maxLatitude = tilePieceBoundingBox.maxLatitude > 85.0511 ? 85.0511 : tilePieceBoundingBox.maxLatitude;
    minLatitude = tilePieceBoundingBox.minLatitude < -85.0511 ? -85.0511 : tilePieceBoundingBox.minLatitude;
    minLongitude = tilePieceBoundingBox.minLongitude - pixelXSize < -180.0 ? -180.0 : tilePieceBoundingBox.minLongitude - pixelXSize;
    maxLongitude = tilePieceBoundingBox.maxLongitude + pixelXSize > 180.0 ? 180.0 : tilePieceBoundingBox.maxLongitude + pixelXSize;
  }
  var pieceBoundingBoxInTileProjectionSW = conversion.inverse([minLongitude, minLatitude]);
  var pieceBoundingBoxInTileProjectionNE = conversion.inverse([maxLongitude, maxLatitude]);
  var pieceBBProjected = {
    minLatitude: isNaN(pieceBoundingBoxInTileProjectionSW[1]) ? tileBoundingBox.minLatitude : pieceBoundingBoxInTileProjectionSW[1],
    maxLatitude: isNaN(pieceBoundingBoxInTileProjectionNE[1]) ? tileBoundingBox.maxLatitude : pieceBoundingBoxInTileProjectionNE[1],
    minLongitude: pieceBoundingBoxInTileProjectionSW[0],
    maxLongitude: pieceBoundingBoxInTileProjectionNE[0]
  };

  var startY = y = Math.max(0, Math.floor((tileBoundingBox.maxLatitude - pieceBBProjected.maxLatitude) / tileHeightUnitsPerPixel));
  var startX = x = Math.max(0, Math.floor((pieceBBProjected.minLongitude - tileBoundingBox.minLongitude) / tileWidthUnitsPerPixel));

  var endY = Math.min(height, height - Math.floor((pieceBBProjected.minLatitude - tileBoundingBox.minLatitude) / tileHeightUnitsPerPixel));
  var endX = Math.min(width, width - Math.floor((tileBoundingBox.maxLongitude - pieceBBProjected.maxLongitude) / tileWidthUnitsPerPixel));

  return {
    startY: startY,
    startX: startX,
    endY: endY,
    endX: endX
  };
}
