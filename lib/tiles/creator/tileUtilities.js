var proj4 = require('proj4');

module.exports.getPiecePosition = function(tilePieceBoundingBox, tileBoundingBox, height, width, projectionTo, projectionFrom, projectionFromDefinition, tileHeightUnitsPerPixel, tileWidthUnitsPerPixel, pixelXSize, pixelYSize) {
  var conversion;
  try {
    conversion = proj4(projectionTo, projectionFrom);
  } catch (e) {}
  if (!conversion) {
    conversion = proj4(projectionTo, projectionFromDefinition);
  }

  var maxLatitude = tilePieceBoundingBox.maxLatitude;
  var minLatitude = tilePieceBoundingBox.minLatitude;
  var minLongitude = tilePieceBoundingBox.minLongitude - pixelXSize;
  var maxLongitude = tilePieceBoundingBox.maxLongitude + pixelXSize;

  if (projectionTo.toUpperCase() === 'EPSG:3857' && projectionFrom.toUpperCase() === 'EPSG:4326') {
    maxLatitude = maxLatitude > 85.0511 ? 85.0511 : maxLatitude;
    minLatitude = minLatitude < -85.0511 ? -85.0511 : minLatitude;
    minLongitude = minLongitude < -180.0 ? -180.0 : minLongitude;
    maxLongitude = maxLongitude > 180.0 ? 180.0 : maxLongitude;
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

module.exports.createPNG = function(width, height, redArray, greenArray, blueArray, alphaOrArray, finalWidth, finalHeight, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    createPNGLwip(width, height, redArray, greenArray, blueArray, alphaOrArray, finalWidth, finalHeight, callback);
  } else {
  }
}

function createPNGLwip(width, height, redArray, greenArray, blueArray, alphaOrArray, finalWidth, finalHeight, callback) {
  var lwip = require('lwip');
  var r = [];
  var g = [];
  var b = [];
  var buff = new Buffer(width * height * 3);

  var length = redArray.length;
  for (var i = 0; i < length; i++) {
    r.push(redArray[i]);
    g.push(greenArray[i]);
    b.push(blueArray[i]);
  }
  var buff = new Buffer(r.concat(g, b));
  lwip.open(buff, {width: width, height: height}, function(err, image) {
    image.resize(finalWidth, finalHeight, function(err, image) {
      image.toBuffer('png', {
        transparency: true
      }, callback);
    });
  });
}
