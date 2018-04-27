
var BoundingBox = require('../boundingBox')
  , TileGrid = require('./tileGrid');

var proj4 = require('proj4');
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

var WEB_MERCATOR_HALF_WORLD_WIDTH = proj4('EPSG:4326', 'EPSG:3857').forward([180, 0])[0];

module.exports.webMercatorTileBox = function(webMercatorBoundingBox, zoom) {
  var totalBox = new BoundingBox(-WEB_MERCATOR_HALF_WORLD_WIDTH, WEB_MERCATOR_HALF_WORLD_WIDTH, -WEB_MERCATOR_HALF_WORLD_WIDTH, WEB_MERCATOR_HALF_WORLD_WIDTH);

  var tilesPerSide = module.exports.tilesPerSideWithZoom(zoom);
  var tileSize = module.exports.tileSizeWithTilesPerSide(tilesPerSide);

  var minX = Math.floor((webMercatorBoundingBox.minLongitude - (-1 * WEB_MERCATOR_HALF_WORLD_WIDTH)) / tileSize);
  var maxX = Math.max(0,Math.floor(((webMercatorBoundingBox.maxLongitude - (-1 * WEB_MERCATOR_HALF_WORLD_WIDTH)) / tileSize) - 1));
  var maxY = Math.max(0,Math.ceil(((-1 * (webMercatorBoundingBox.minLatitude - WEB_MERCATOR_HALF_WORLD_WIDTH)) / tileSize) - 1));
  var minY = Math.floor((-1 * (webMercatorBoundingBox.maxLatitude - WEB_MERCATOR_HALF_WORLD_WIDTH)) / tileSize);

  return {
    minX: minX,
    maxX: maxX,
    minY: minY,
    maxY: maxY
  };
}
//
//
// /**
//  *  Tile Bounding Box utility methods
//  */
// @interface GPKGTileBoundingBoxUtils : NSObject
//
// /**
//  *  Get the overlapping bounding box between the two bounding boxes
//  *
//  *  @param boundingBox  bounding box
//  *  @param boundingBox2 bounding box 2
//  *
//  *  @return bounding box
//  */
// +(GPKGBoundingBox *) overlapWithBoundingBox: (GPKGBoundingBox *) boundingBox andBoundingBox: (GPKGBoundingBox *) boundingBox2;
//
// /**
//  *  Get the union bounding box combining the two bounding boxes
//  *
//  *  @param boundingBox  bounding box
//  *  @param boundingBox2 bounding box 2
//  *
//  *  @return bounding box
//  */
// +(GPKGBoundingBox *) unionWithBoundingBox: (GPKGBoundingBox *) boundingBox andBoundingBox: (GPKGBoundingBox *) boundingBox2;
//
// /**
//  *  Get the X pixel for where the longitude fits into the bounding box
//  *
//  *  @param width       width
//  *  @param boundingBox bounding box
//  *  @param longitude   longitude
//  *
//  *  @return x pixel
//  */
module.exports.getXPixelOffset = function(width, boundingBox, longitude) {
  var boxWidth = boundingBox.maxLongitude - boundingBox.minLongitude;
  var offset = longitude - boundingBox.minLongitude;
  var percentage = offset / boxWidth;
  var pixel = percentage * width;

  return pixel;
}
/**
 *  Get the longitude from the pixel location, bounding box, and image width
 *
 *  @param width       width
 *  @param boundingBox bounding box
 *  @param pixel       x pixel
 *
 *  @return longitude
 */
module.exports.getLongitudeFromPixelWithWidth = function(width, boundingBox, pixel) {
  var boxWidth = boundingBox.maxLongitude - boundingBox.minLongitude;
  var percentage = pixel / width;
  var offset = percentage * boxWidth;
  return offset + boundingBox.minLongitude;
}

module.exports.getLatitudeFromPixelWithHeight = function(height, boundingBox, pixel) {
  var boxHeight = boundingBox.maxLatitude - boundingBox.minLatitude;
  var percentage = pixel / height;
  var offset = percentage * boxHeight;
  return boundingBox.maxLatitude - offset;
}

//
// /**
//  *  Get the Y pixel for where the latitude fits into the bounding box
//  *
//  *  @param height      height
//  *  @param boundingBox bounding box
//  *  @param latitude    latitude
//  *
//  *  @return y pixel
//  */
module.exports.getYPixelOffset = function(height, boundingBox, latitude) {
  var boxHeight = boundingBox.maxLatitude - boundingBox.minLatitude;
  var offset = boundingBox.maxLatitude - latitude;
  var percentage = offset / boxHeight;
  var pixel = percentage * height;

  return pixel;
}

module.exports.determinePositionAndScale = function(geoPackageTileBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth) {
  var p = {};

  var finalTileWidth = totalBoundingBox.maxLongitude - totalBoundingBox.minLongitude;
  var xoffsetMin = geoPackageTileBoundingBox.minLongitude - totalBoundingBox.minLongitude;
  var xpercentageMin = xoffsetMin / finalTileWidth;

  var finalTileHeight = totalBoundingBox.maxLatitude - totalBoundingBox.minLatitude;
  var yoffsetMax = totalBoundingBox.maxLatitude - geoPackageTileBoundingBox.maxLatitude;
  var ypercentageMax = yoffsetMax / finalTileHeight;

  var gpTileWidth = geoPackageTileBoundingBox.maxLongitude - geoPackageTileBoundingBox.minLongitude;
  var gpPixelsPerUnitWidth = tileWidth / gpTileWidth;

  var finalTilePixelsPerUnitWidth = totalWidth / finalTileWidth;

  var xPositionInFinalTileUnits = ((geoPackageTileBoundingBox.minLongitude - totalBoundingBox.minLongitude) * finalTilePixelsPerUnitWidth);
  var widthInFinalTileUnits = ((geoPackageTileBoundingBox.maxLongitude - geoPackageTileBoundingBox.minLongitude) * finalTilePixelsPerUnitWidth);

  var gpTileHeight = geoPackageTileBoundingBox.maxLatitude - geoPackageTileBoundingBox.minLatitude;
  var gpPixelsPerUnitHeight = tileHeight / gpTileHeight;

  var finalTilePixelsPerUnitHeight = totalHeight / finalTileHeight;

  var yPositionInFinalTileUnits = ((totalBoundingBox.maxLatitude - geoPackageTileBoundingBox.maxLatitude) * finalTilePixelsPerUnitHeight);
  var heightInFinalTileUnits = (geoPackageTileBoundingBox.maxLatitude - geoPackageTileBoundingBox.minLatitude) * finalTilePixelsPerUnitHeight;

  p.yPositionInFinalTileStart = Math.round(Math.max(0, ypercentageMax * totalHeight));
  p.xPositionInFinalTileStart = Math.round(Math.max(0, xpercentageMin * totalWidth));
  p.dx = xPositionInFinalTileUnits;
  p.dy = yPositionInFinalTileUnits;
  p.sx = 0;
  p.sy = 0;
  p.dWidth = widthInFinalTileUnits;
  p.dHeight = heightInFinalTileUnits;
  p.sWidth = tileWidth;
  p.sHeight = tileHeight;

  return p;
}

/**
 * Get the Web Mercator tile bounding box from the Standard Maps API tile
 * coordinates and zoom level
 *
 *  @param x    x
 *  @param y    y
 *  @param zoom zoom level
 *
 *  @return web mercator bounding box
 */
module.exports.getWebMercatorBoundingBoxFromXYZ = function(x, y, zoom) {
  var tilesPerSide = module.exports.tilesPerSideWithZoom(zoom);
	var tileSize = module.exports.tileSizeWithTilesPerSide(tilesPerSide);

	var minLon = (-1 * WEB_MERCATOR_HALF_WORLD_WIDTH)
			+ (x * tileSize);
	var maxLon = (-1 * WEB_MERCATOR_HALF_WORLD_WIDTH)
			+ ((x + 1) * tileSize);
	var minLat = WEB_MERCATOR_HALF_WORLD_WIDTH
			- ((y + 1) * tileSize);
	var maxLat = WEB_MERCATOR_HALF_WORLD_WIDTH
			- (y * tileSize);

	var box = new BoundingBox(minLon, maxLon, minLat, maxLat);

	return box;
}

/**
 *  Get the tile size in meters
 *
 *  @param tilesPerSide tiles per side
 *
 *  @return meters
 */
module.exports.tileSizeWithTilesPerSide = function(tilesPerSide) {
  return (2*WEB_MERCATOR_HALF_WORLD_WIDTH) / tilesPerSide;
}

/**
 *  Get the tiles per side, width and height, at the zoom level
 *
 *  @param zoom zoom level
 *
 *  @return tiles per side
 */
module.exports.tilesPerSideWithZoom = function(zoom) {
  return Math.pow(2,zoom);
}

/**
 *  Get the tile grid
 *
 *  @param webMercatorTotalBox    web mercator total bounding box
 *  @param matrixWidth            matrix width
 *  @param matrixHeight           matrix height
 *  @param boundingBox            bounding box
 *
 *  @return tile grid
 */
module.exports.getTileGridWithTotalBoundingBox = function(totalBoundingBox, matrixWidth, matrixHeight, boundingBox) {
  var minColumn = module.exports.getTileColumnWithTotalBoundingBox(totalBoundingBox, matrixWidth, boundingBox.minLongitude);
  var maxColumn = module.exports.getTileColumnWithTotalBoundingBox(totalBoundingBox, matrixWidth, boundingBox.maxLongitude, true);
  if (minColumn < matrixWidth && maxColumn >= 0) {
    if (minColumn < 0) {
      minColumn = 0;
    }
    if (maxColumn >= matrixWidth) {
      maxColumn = matrixWidth - 1;
    }
  }

  var maxRow = module.exports.getTileRowWithTotalBoundingBox(totalBoundingBox, matrixHeight, boundingBox.minLatitude, true);
  var minRow = module.exports.getTileRowWithTotalBoundingBox(totalBoundingBox, matrixHeight, boundingBox.maxLatitude);


  if(minRow < matrixHeight && maxRow >= 0){
    if(minRow < 0){
      minRow = 0;
    }
    if(maxRow >= matrixHeight){
      maxRow = matrixHeight - 1;
    }
  }

  var tileGrid = new TileGrid(minColumn, maxColumn, minRow, maxRow);
  return tileGrid;
}

/**
 *  Get the tile column of the longitude in degrees
 *
 *  @param webMercatorTotalBox web mercator total bounding box
 *  @param matrixWidth         matrix width
 *  @param longitude           longitude
 *
 *  @return tile column
 */
module.exports.getTileColumnWithTotalBoundingBox = function(webMercatorTotalBox, matrixWidth, longitude, max) {
  var minX = webMercatorTotalBox.minLongitude;
  var maxX = webMercatorTotalBox.maxLongitude;
  var tileId;
  if (longitude < minX) {
    tileId = -1;
  } else if (longitude >= maxX) {
    tileId = matrixWidth;
  } else {
    var matrixWidthMeters = maxX - minX;
    var tileWidth = matrixWidthMeters / matrixWidth;
    var tileIdDouble = ((longitude - minX) / tileWidth);
    tileId = ~~tileIdDouble;
    if (max) {
      // if the edge lands right on the calculated edge, subtract one
      if (tileIdDouble === tileId) {
        tileId--;
      }
    }
  }
  return tileId;
}

/**
 *  Get the tile row of the latitude in degrees
 *
 *  @param webMercatorTotalBox web mercator total bounding box
 *  @param matrixHeight        matrix height
 *  @param latitude            latitude
 *
 *  @return tile row
 */
module.exports.getTileRowWithTotalBoundingBox = function(webMercatorTotalBox, matrixHeight, latitude, max) {
  var minY = webMercatorTotalBox.minLatitude;
  var maxY = webMercatorTotalBox.maxLatitude;

  var tileId;
  if (latitude < minY) {
    tileId = matrixHeight;
  } else if (latitude >= maxY) {
    tileId = -1;
  } else {
    var matrixHeightMeters = maxY - minY;
    var tileHeight = matrixHeightMeters / matrixHeight;
    var tileIdDouble = ((maxY - latitude) / tileHeight);
    tileId = ~~tileIdDouble;
    if (max) {
      // if the edge lands right on the calculated edge, add one
      if (tileIdDouble === tileId) {
        tileId--;
      }
    }
  }
  return tileId;
}

/**
 *  Get the web mercator bounding box of the tile column and row in the tile
 *  matrix using the total bounding box
 *
 *  @param webMercatorTotalBox web mercator total bounding box
 *  @param tileMatrix          tile matrix
 *  @param tileColumn          tile column
 *  @param tileRow             tile row
 *
 *  @return web mercator bounding box
 */
module.exports.getTileBoundingBox = function(box, tileMatrix, tileColumn, tileRow) {
  var tileMatrixWidth = tileMatrix.matrix_width;
  var tileMatrixHeight = tileMatrix.matrix_height;
  var tileGrid = new TileGrid(tileColumn, tileColumn, tileRow, tileRow);
  var matrixMinX = box.minLongitude;
  var matrixMaxX = box.maxLongitude;
  var matrixWidth = matrixMaxX - matrixMinX;
  var tileWidth = matrixWidth / tileMatrixWidth;

  // Find the longitude range
  var minLon = matrixMinX + (tileWidth * tileGrid.min_x);
  var maxLon = minLon + (tileWidth * (tileGrid.max_x + 1 - tileGrid.min_x));

  // Get the tile height
  var matrixMinY = box.minLatitude;
  var matrixMaxY = box.maxLatitude;
  var matrixHeight = matrixMaxY - matrixMinY;
  var tileHeight = matrixHeight / tileMatrixHeight;

  // Find the latitude range
  var maxLat = matrixMaxY - (tileHeight * tileGrid.min_y);
  var minLat = maxLat - (tileHeight * (tileGrid.max_y + 1 - tileGrid.min_y));

  var boundingBox = new BoundingBox(minLon, maxLon, minLat, maxLat);

  return boundingBox;
}

module.exports.getTileGridBoundingBox = function(matrixSetBoundingBox, tileMatrixWidth, tileMatrixHeight, tileGrid) {
  // Get the tile width
  var matrixMinX = matrixSetBoundingBox.minLongitude;
  var matrixMaxX = matrixSetBoundingBox.maxLongitude;
  var matrixWidth = matrixMaxX - matrixMinX;
  var tileWidth = matrixWidth / tileMatrixWidth;

  // Find the longitude range
  var minLon = matrixMinX + (tileWidth * tileGrid.min_x);
  var maxLon = minLon + (tileWidth * (tileGrid.max_x + 1 - tileGrid.min_x));

  // Get the tile height
  var matrixMinY = matrixSetBoundingBox.minLatitude;
  var matrixMaxY = matrixSetBoundingBox.maxLatitude;
  var matrixHeight = matrixMaxY - matrixMinY;
  var tileHeight = matrixHeight / tileMatrixHeight;

  // Find the latitude range
  var maxLat = matrixMaxY - (tileHeight * tileGrid.min_y);
  var minLat = maxLat - (tileHeight * (tileGrid.max_y + 1 - tileGrid.min_y));

  return new BoundingBox(minLon, maxLon, minLat, maxLat);
}
