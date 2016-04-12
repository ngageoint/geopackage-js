


var BoundingBox = require('../boundingBox')
  , TileGrid = require('./tileGrid');

var proj4 = require('proj4');

/**
 * Get the overlapping bounding box between the two bounding boxes
 * @param  {[type]} boundingBox  [description]
 * @param  {[type]} boundingBox2 [description]
 * @return {[type]}              [description]
 */
module.exports.overlapWithBoundingBox = function(boundingBox, boundingBox2) {
  var minLongitude = Math.max(boundingBox.minLongitude, boundingBox2.minLongitude);
  var maxLongitude = Math.min(boundingBox.maxLongitude, boundingBox2.maxLongitude);
  var minLatitude = Math.max(boundingBox.minLatitude, boundingBox2.minLatitude);
  var maxLatitude = Math.min(boundingBox.maxLatitude, boundingBox2.maxLatitude);

  console.log('boundingBox', boundingBox);
  console.log('boundingBox2', boundingBox2);

  console.log('boundingBox.minLatitude', boundingBox.minLatitude);
  console.log('boundingBox2.minLatitude', boundingBox2.minLatitude);
  console.log(Math.max(boundingBox.minLatitude, boundingBox2.minLatitude));
  console.log('boundingBox.maxLatitude', boundingBox.maxLatitude);
  console.log('boundingBox2.maxLatitude', boundingBox2.maxLatitude);
  console.log(Math.min(boundingBox.maxLatitude, boundingBox2.maxLatitude));

  console.log('minLongitude', minLongitude);
  console.log('maxLongitude', maxLongitude);
  console.log('minLatitude', minLatitude);
  console.log('maxLatitude', maxLatitude);
  var overlap;
  if (minLongitude < maxLongitude && minLatitude < maxLatitude) {
    overlap = new BoundingBox(minLongitude, maxLongitude, minLatitude, maxLatitude);
  }

  return overlap;
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
// +(double) getXPixelWithWidth: (int) width andBoundingBox: (GPKGBoundingBox *) boundingBox andLongitude: (double) longitude;
//
// /**
//  *  Get the longitude from the pixel location, bounding box, and image width
//  *
//  *  @param width       width
//  *  @param boundingBox bounding box
//  *  @param pixel       x pixel
//  *
//  *  @return longitude
//  */
// +(double) getLongitudeFromPixelWithWidth: (int) width andBoundingBox: (GPKGBoundingBox *) boundingBox andPixel: (double) pixel;
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
// +(double) getYPixelWithHeight: (int) height andBoundingBox: (GPKGBoundingBox *) boundingBox andLatitude: (double) latitude;
//
// /**
//  *  Get the latitude from the pixel location, bounding box, and image height
//  *
//  *  @param height      height
//  *  @param boundingBox bounding box
//  *  @param pixel       y pixel
//  *
//  *  @return latitude
//  */
// +(double) getLatitudeFromPixelWithHeight: (int) height andBoundingBox: (GPKGBoundingBox *) boundingBox andPixel: (double) pixel;
//
// /**
//  * Get the tile bounding box from the Standard Maps API tile coordinates and
//  * zoom level
//  *
//  *  @param x    x
//  *  @param y    y
//  *  @param zoom zoom level
//  *
//  *  @return bounding box
//  */
// +(GPKGBoundingBox *) getBoundingBoxWithX: (int) x andY: (int) y andZoom: (int) zoom;
//

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

function tile2lon(x,z) {
  return (x/Math.pow(2,z)*360-180);
}

function tile2lat(y,z) {
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

var getX = function(lon, zoom) {
  if (zoom == 0) return 0;
  var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
  return xtile;
}

var getY = function(lat, zoom) {
  if (zoom == 0) return 0;
  var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
  return ytile;
}

var xCalculator = function(bbox,z) {
  var x = [];
  var x1 = getX(Number(bbox[0]), z);
  var x2 = getX(Number(bbox[2]), z);
  x.max = Math.max(x1, x2);
  x.min = Math.max(0,Math.min(x1, x2));
  if (z == 0){
    x.current = Math.min(x1, x2);
  }
  return x;
}

var yCalculator = function(bbox,z) {
  var y = [];
  var y1 = getY(Number(bbox[1]), z);
  var y2 = getY(Number(bbox[3]), z);
  y.max = Math.max(y1, y2);
  y.min = Math.max(0,Math.min(y1, y2));
  y.current = Math.min(y1, y2);
  return y;
}

var tileBboxCalculator = function(x, y, z) {
  x = Number(x);
  y = Number(y);
  var tileBounds = {
    north: tile2lat(y, z),
    east: tile2lon(x+1, z),
    south: tile2lat(y+1, z),
    west: tile2lon(x, z)
  };

  return tileBounds;
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
  var tileBounds = tileBboxCalculator(x, y, zoom);

  var bb = new BoundingBox(tileBounds.west, tileBounds.east, tileBounds.south, tileBounds.north);
  return bb.projectBoundingBox('EPSG:4326', 'EPSG:3857');
}
//
// /**
//  * Get the Web Mercator tile bounding box from the Standard Maps API tile grid
//  * and zoom level
//  *
//  *  @param tileGrid tile grid
//  *  @param zoom     zoom
//  *
//  *  @return web mercator bounding box
//  */
// +(GPKGBoundingBox *) getWebMercatorBoundingBoxWithTileGrid: (GPKGTileGrid *) tileGrid andZoom: (int) zoom;
//
// /**
//  * Get the Projected tile bounding box from the Standard Maps API tile
//  * coordinates and zoom level
//  *
//  *  @param projectionEpsg projection epsg code
//  *  @param x              x
//  *  @param y              y
//  *  @param zoom           zoom level
//  *
//  *  @return bounding box
//  */
// +(GPKGBoundingBox *) getProjectedBoundingBoxWithProjectionEpsg: (NSNumber *) projectionEpsg andX: (int) x andY: (int) y andZoom: (int) zoom;
//
// /**
//  * Get the Projected tile bounding box from the Standard Maps API tile
//  * coordinates and zoom level
//  *
//  *  @param projection     projection
//  *  @param x              x
//  *  @param y              y
//  *  @param zoom           zoom level
//  *
//  *  @return bounding box
//  */
// +(GPKGBoundingBox *) getProjectedBoundingBoxWithProjection: (GPKGProjection *) projection andX: (int) x andY: (int) y andZoom: (int) zoom;
//
// /**
//  * Get the Projected tile bounding box from the Standard Maps API tile
//  * tileGrid and zoom level
//  *
//  *  @param projectionEpsg projection epsg code
//  *  @param tileGrid       tile grid
//  *  @param zoom           zoom level
//  *
//  *  @return bounding box
//  */
// +(GPKGBoundingBox *) getProjectedBoundingBoxWithProjectionEpsg: (NSNumber *) projectionEpsg andTileGrid: (GPKGTileGrid *) tileGrid andZoom: (int) zoom;
//
// /**
//  * Get the Projected tile bounding box from the Standard Maps API tile
//  * tileGrid and zoom level
//  *
//  *  @param projection projection
//  *  @param tileGrid   tile grid
//  *  @param zoom       zoom level
//  *
//  *  @return bounding box
//  */
// +(GPKGBoundingBox *) getProjectedBoundingBoxWithProjection: (GPKGProjection *) projection andTileGrid: (GPKGTileGrid *) tileGrid andZoom: (int) zoom;
//
// /**
//  *  Get the tile grid for the location specified as WGS84
//  *
//  *  @param point  WGS84 point
//  *  @param zoom   zoom level
//  *
//  *  @return tile grid
//  */
// +(GPKGTileGrid *) getTileGridFromWGS84Point: (WKBPoint *) point andZoom: (int) zoom;
//
// /**
//  *  Get the tile grid for the location specified as the projection
//  *
//  *  @param point        point
//  *  @param zoom         zoom level
//  *  @param projection   point projection
//  *
//  *  @return tile grid
//  */
// +(GPKGTileGrid *) getTileGridFromPoint: (WKBPoint *) point andZoom: (int) zoom andProjection: (GPKGProjection *) projection;
//
// /**
//  *  Get the tile grid that includes the entire tile bounding box
//  *
//  *  @param webMercatorBoundingBox web mercator bounding box
//  *  @param zoom                   zoom level
//  *
//  *  @return tile grid
//  */
// +(GPKGTileGrid *) getTileGridWithWebMercatorBoundingBox: (GPKGBoundingBox *) webMercatorBoundingBox andZoom: (int) zoom;
//
// /**
//  *  Convert the bounding box coordinates to a new web mercator bounding box
//  *
//  *  @param boundingBox bounding box
//  *
//  *  @return web mercator bounding box
//  */
// +(GPKGBoundingBox *) toWebMercatorWithBoundingBox: (GPKGBoundingBox *) boundingBox;
//
// /**
//  *  Get the tile size in meters
//  *
//  *  @param tilesPerSide tiles per side
//  *
//  *  @return meters
//  */
// +(double) tileSizeWithTilesPerSide: (int) tilesPerSide;
//
// /**
//  *  Get the tile width in degrees
//  *
//  *  @param tilesPerSide tiles per side
//  *
//  *  @return degrees
//  */
// +(double) tileWidthDegreesWithTilesPerSide: (int) tilesPerSide;
//
// /**
//  *  Get the tile height in degrees
//  *
//  *  @param tilesPerSide tiles per side
//  *
//  *  @return degrees
//  */
// +(double) tileHeightDegreesWithTilesPerSide: (int) tilesPerSide;
//
// /**
//  *  Get the tiles per side, width and height, at the zoom level
//  *
//  *  @param zoom zoom level
//  *
//  *  @return tiles per side
//  */
// +(int) tilesPerSideWithZoom: (int) zoom;
module.exports.tilesPerSideWithZoom = function(zoom) {
  return Math.pow(2,z);
}
// /**
//  *  Get the standard y tile location as TMS or a TMS y location as standard
//  *
//  *  @param zoom zoom
//  *  @param y    y
//  *
//  *  @return opposite y format
//  */
// +(int) getYAsOppositeTileFormatWithZoom: (int) zoom andY: (int) y;
//
// /**
//  *  Get the zoom level from the tiles per side
//  *
//  *  @param tilesPerSide tiles per side
//  *
//  *  @return zoom level
//  */
// +(int) zoomFromTilesPerSide: (int) tilesPerSide;
//
// /**
//  *  Get the tile grid
//  *
//  *  @param webMercatorTotalBox    web mercator total bounding box
//  *  @param matrixWidth            matrix width
//  *  @param matrixHeight           matrix height
//  *  @param webMercatorBoundingBox web mercator bounding box
//  *
//  *  @return tile grid
//  */
// +(GPKGTileGrid *) getTileGridWithWebMercatorTotalBoundingBox: (GPKGBoundingBox *) webMercatorTotalBox andMatrixWidth: (int) matrixWidth andMatrixHeight: (int) matrixHeight andWebMercatorBoundingBox: (GPKGBoundingBox *) webMercatorBoundingBox;
//
module.exports.getTileGridWithWebMercatorTotalBoundingBox = function(webMercatorTotalBox, matrixWidth, matrixHeight, webMercatorBoundingBox) {
  var minColumn = module.exports.getTileColumnWithWebMercatorTotalBoundingBox(webMercatorTotalBox, matrixWidth, webMercatorBoundingBox.minLongitude);
  var maxColumn = module.exports.getTileColumnWithWebMercatorTotalBoundingBox(webMercatorTotalBox, matrixWidth, webMercatorBoundingBox.maxLongitude);

  if (minColumn < matrixWidth && maxCOlumn >= 0) {
    if (minColumn < 0) {
      minColumn = 0;
    }
    if (maxColumn >= matrixWidth) {
      maxColumn = matrixWidth - 1;
    }
  }

  var maxRow = module.exports.getTileRowWithWebMercatorTotalBoundingBox(webMercatorTotalBox, matrixHeight, webMercatorBoundingBox.minLatitude);
  var minRow = module.exports.getTileRowWithWebMercatorTotalBoundingBox(webMercatorTotalBox, matrixHeight, webMercatorBoundingBox.maxLatitude);


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

// /**
//  *  Get the tile column of the longitude in degrees
//  *
//  *  @param webMercatorTotalBox web mercator total bounding box
//  *  @param matrixWidth         matrix width
//  *  @param longitude           longitude
//  *
//  *  @return tile column
//  */
// +(int) getTileColumnWithWebMercatorTotalBoundingBox: (GPKGBoundingBox *) webMercatorTotalBox andMatrixWidth: (int) matrixWidth andLongitude: (double) longitude;
module.exports.getTileColumnWithWebMercatorTotalBoundingBox = function(webMercatorTotalBox, matrixWidth, longitude) {
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
    tileId = ((longitude - minX) / tileWidth);
  }
  return tileId;
}
//
// /**
//  *  Get the tile row of the latitude in degrees
//  *
//  *  @param webMercatorTotalBox web mercator total bounding box
//  *  @param matrixHeight        matrix height
//  *  @param latitude            latitude
//  *
//  *  @return tile row
//  */
// +(int) getTileRowWithWebMercatorTotalBoundingBox: (GPKGBoundingBox *) webMercatorTotalBox andMatrixHeight: (int) matrixHeight andLatitude: (double) latitude;
//
module.exports.getTileRowWithWebMercatorTotalBoundingBox = function(webMercatorTotalBox, matrixHeight, latitude) {
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
    tileId = ((maxY - latitude) / tileHeight);
  }
  return tileId;
}
// /**
//  *  Get the web mercator bounding box of the tile column and row in the tile
//  *  matrix using the total bounding box
//  *
//  *  @param webMercatorTotalBox web mercator total bounding box
//  *  @param tileMatrix          tile matrix
//  *  @param tileColumn          tile column
//  *  @param tileRow             tile row
//  *
//  *  @return web mercator bounding box
//  */
// +(GPKGBoundingBox *) getWebMercatorBoundingBoxWithWebMercatorTotalBoundingBox: (GPKGBoundingBox *) webMercatorTotalBox andTileMatrix: (GPKGTileMatrix *) tileMatrix andTileColumn: (int) tileColumn andTileRow: (int) tileRow;
//
// /**
//  *  Get the web mercator bounding box of the tile column and row in the tile
//  *  width and height bounds using the total bounding box
//  *
//  *  @param webMercatorTotalBox web mercator total bounding box
//  *  @param tileMatrixWidth     matrix width
//  *  @param tileMatrixHeight    matrix height
//  *  @param tileColumn          tile column
//  *  @param tileRow             tile row
//  *
//  *  @return web mercator bounding box
//  */
// +(GPKGBoundingBox *) getWebMercatorBoundingBoxWithWebMercatorTotalBoundingBox: (GPKGBoundingBox *) webMercatorTotalBox andTileMatrixWidth: (int) tileMatrixWidth andTileMatrixHeight: (int) tileMatrixHeight andTileColumn: (int) tileColumn andTileRow: (int) tileRow;
//
/**
 *  Get the web mercator bounding box of the tile grid in the tile matrix
 *  using the total bounding box
 *
 *  @param webMercatorTotalBox web mercator total bounding box
 *  @param tileMatrixWidth     matrix width
 *  @param tileMatrixHeight    matrix height
 *  @param tileGrid            tile grid
 *
 *  @return web mercator bounding box
 */
module.exports.getWebMercatorBoundingBoxWithWebMercatorTotalBoundingBox = function(webMercatorTotalBox, tileMatrixWidth, tileMatrixHeight, tileGrid) {
  // Get the tile width
  var matrixMinX = webMercatorTotalBox.minLongitude;
  var matrixMaxX = webMercatorTotalBox.maxLongitude;
  var matrixWidth = matrixMaxX - matrixMinX;
  var tileWidth = matrixWidth / tileMatrixWidth;

  // Find the longitude range
  var minLon = matrixMinX + (tileWidth * tileGrid.minX);
  var maxLon = minLon + (tileWidth * (tileGrid.maxX + 1 - tileGrid.minX));

  // Get the tile height
  var matrixMinY = webMercatorTotalBox.minLatitude;
  var matrixMaxY = webMercatorTotalBox.maxLatitude;
  var matrixHeight = matrixMaxY - matrixMinY;
  var tileHeight = matrixHeight / tileMatrixHeight;

  // Find the latitude range
  var maxLat = matrixMaxY - (tileHeight * tileGrid.minY);
  var minLat = maxLat - (tileHeight * (tileGrid.maxY + 1 - tileGrid.minY));

  return new BoundingBox(minLon, maxLon, minLat, maxLat);
}

// /**
//  *  Get the web mercator bounding box of the tile grid in the tile width and
//  *  height bounds using the total bounding box
//  *
//  *  @param webMercatorTotalBox web mercator total bounding box
//  *  @param tileMatrixWidth     matrix width
//  *  @param tileMatrixHeight    matrix height
//  *  @param tileGrid            tile grid
//  *
//  *  @return web mercator bounding box
//  */
// +(GPKGBoundingBox *) getWebMercatorBoundingBoxWithWebMercatorTotalBoundingBox: (GPKGBoundingBox *) webMercatorTotalBox andTileMatrixWidth: (int) tileMatrixWidth andTileMatrixHeight: (int) tileMatrixHeight andTileGrid: (GPKGTileGrid *) tileGrid;
//
// /**
//  * Get the zoom level of where the web mercator bounding box fits into the
//  * complete world
//  *
//  *  @param webMercatorBoundingBox web mercator bounding box
//  *
//  *  @return zoom level
//  */
// +(int) getZoomLevelWithWebMercatorBoundingBox: (GPKGBoundingBox *) webMercatorBoundingBox;
//
// /**
//  *  Get the location bearing a distance from a current location
//  *
//  *  @param bearing  bearing
//  *  @param meters   meters
//  *  @param location from location
//  *
//  *  @return to location
//  */
// +(CLLocationCoordinate2D) locationWithBearing: (double) bearing andDistance: (double) meters fromLocation: (CLLocationCoordinate2D) location;
//
// /**
//  *  Get the bearing from a location to a location
//  *
//  *  @param from from location
//  *  @param to   to location
//  *
//  *  @return bearing
//  */
// +(double) bearingFromLocation: (CLLocationCoordinate2D) from andToLocation: (CLLocationCoordinate2D) to;
//
// /**
//  *  Get the distance between two locations
//  *
//  *  @param location1 location 1
//  *  @param location2 location 2
//  *
//  *  @return distance in meters
//  */
// +(double) distanceBetweenLocation: (CLLocationCoordinate2D) location1 andLocation: (CLLocationCoordinate2D) location2;
//
// /**
//  *  Get the location point between two locations
//  *
//  *  @param from from location
//  *  @param to   to location
//  *
//  *  @return between point
//  */
// +(CLLocationCoordinate2D) pointBetweenFromLocation: (CLLocationCoordinate2D) from andToLocation: (CLLocationCoordinate2D) to;
//
// /**
//  *  Bound the uppper and lower bounds of the WGS84 bounding box with web mercator limits
//  *
//  *  @param boundingBox wgs84 bounding box
//  *
//  *  @return bounding box
//  */
// +(GPKGBoundingBox *) boundWgs84BoundingBoxWithWebMercatorLimits: (GPKGBoundingBox *) boundingBox;
