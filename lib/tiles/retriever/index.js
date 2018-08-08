var TileMatrixSetDao = require('../matrixset').TileMatrixSetDao
  , TileBoundingBoxUtils = require('../tileBoundingBoxUtils')
  , TileCreator = require('../creator')
  , BoundingBox = require('../../boundingBox');

var async = require('async')
  , proj4 = require('proj4');

proj4 = 'default' in proj4 ? proj4['default'] : proj4;

var GeoPackageTileRetriever = function(tileDao, width, height) {
  this.tileDao = tileDao;
  this.tileDao.adjustTileMatrixLengths();

  this.width = width;
  this.height = height;
}

module.exports = GeoPackageTileRetriever;

GeoPackageTileRetriever.prototype.getWebMercatorBoundingBox = function () {
  if (this.setWebMercatorBoundingBox) {
    return this.setWebMercatorBoundingBox;
  } else {
    var tileMatrixSetDao = new TileMatrixSetDao(this.tileDao.connection);
    var tileMatrixSet = this.tileDao.tileMatrixSet;
    var srs = tileMatrixSetDao.getSrs(tileMatrixSet);
    this.setProjectionBoundingBox = tileMatrixSet.getBoundingBox();
    if (srs.organization_coordsys_id === 4326 && srs.organization === 'EPSG') {
      this.setProjectionBoundingBox.minLatitude = Math.max(this.setProjectionBoundingBox.minLatitude, -85.05);
      this.setProjectionBoundingBox.maxLatitude = Math.min(this.setProjectionBoundingBox.maxLatitude, 85.05);
    }
    this.setWebMercatorBoundingBox = this.setProjectionBoundingBox.projectBoundingBox(this.tileDao.projection, 'EPSG:3857');

    return this.setWebMercatorBoundingBox;
  }
};

GeoPackageTileRetriever.prototype.hasTile = function (x, y, zoom) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  var tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoom);
  var iterator = this.retrieveTileResults(webMercatorBoundingBox, tileMatrix);
  var exists = false;
  for (var row of iterator) {
    exists = true;
  }
  return exists;
};

GeoPackageTileRetriever.prototype.getTile = function (x, y, zoom) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  var gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox, zoom);
  return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857');
};

GeoPackageTileRetriever.prototype.drawTileIn = function (x, y, zoom, canvas) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  var gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox, zoom);
  return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857', canvas);
};

GeoPackageTileRetriever.prototype.getTileWithWgs84Bounds = function (wgs84BoundingBox, zoom) {
  var webMercatorBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');
  var gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox, zoom);
  return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857');
};

GeoPackageTileRetriever.prototype.getTileWithWgs84BoundsInProjection = function (wgs84BoundingBox, zoom, targetProjection) {
  var targetBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', targetProjection);
  return this.getTileWithBounds(targetBoundingBox, zoom, targetProjection);
};

GeoPackageTileRetriever.prototype.getWebMercatorTile = function (x, y, zoom) {
  // need to determine the geoPackage zoom level from the web mercator zoom level
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  var gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox, zoom);
  return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857');
};

function precision(a) {
  if (!isFinite(a)) return 0;
  var e = 1, p = 0;
  while (Math.round(a * e) / e !== a) { e *= 10; p++; }
  return p;
}

GeoPackageTileRetriever.prototype.determineGeoPackageZoomLevel = function(webMercatorBoundingBox, zoom) {
  // find width and height of this tile in geopackage projection
  var proj4Projection = proj4(this.tileDao.projection, 'EPSG:3857');
  var ne = proj4Projection.inverse([webMercatorBoundingBox.maxLongitude, webMercatorBoundingBox.maxLatitude]);
  var sw = proj4Projection.inverse([webMercatorBoundingBox.minLongitude, webMercatorBoundingBox.minLatitude]);
  var width = (ne[0] - sw[0]);
  var height = (ne[1] - sw[1]);
  var gpZoom = this.tileDao.maxZoom;
  // find the closest zoom for width
  for (var i = 0; i < this.tileDao.widths.length; i++) {
    var tileWidth = this.tileDao.widths[i];
    var difference = Math.abs(width - tileWidth);
    var tolerance = 2*(1/(Math.pow(10,precision(tileWidth))));
    if (tileWidth <= width || difference <= tolerance) gpZoom = this.tileDao.maxZoom - i;
  }

  return gpZoom;
};

GeoPackageTileRetriever.prototype.getTileWithBounds = function (targetBoundingBox, zoom, targetProjection, canvas) {
  var tiles = [];
  var tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoom);
  if (!tileMatrix) return callback();
  var tileWidth = tileMatrix.tile_width;
  var tileHeight = tileMatrix.tile_height;
  var matrixSetBoundsInTargetProjection = this.tileDao.tileMatrixSet.getBoundingBox().projectBoundingBox(this.tileDao.projection, targetProjection);

  var matrixTotalBoundingBox = this.tileDao.tileMatrixSet.getBoundingBox();
  var targetBoundingBoxInMatrixSetProjection = targetBoundingBox.projectBoundingBox(targetProjection, this.tileDao.projection);

  var tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(matrixTotalBoundingBox, tileMatrix.matrix_width, tileMatrix.matrix_height, targetBoundingBoxInMatrixSetProjection);
  var creator = TileCreator.initialize(this.width || tileWidth, this.height || tileHeight, tileMatrix, this.tileDao.tileMatrixSet, targetBoundingBox, this.tileDao.srs, targetProjection, canvas);

  var iterator = this.retrieveTileResults(targetBoundingBox.projectBoundingBox(targetProjection, this.tileDao.projection), tileMatrix);
  for (var tile of iterator) {
    tiles.push({
      data: tile.getTileData(),
      gridColumn: tile.getTileColumn(),
      gridRow: tile.getTileRow()
    });
  }

  return tiles.reduce(function(sequence, tile) {
    return sequence.then(function() {
      return creator.addTile(tile.data, tile.gridColumn, tile.gridRow);
    });
  }, Promise.resolve())
  .then(function() {
    if (!canvas) {
      return creator.getCompleteTile('png');
    }
  });
};

GeoPackageTileRetriever.prototype.retrieveTileResults = function (tileMatrixProjectionBoundingBox, tileMatrix) {
  if(tileMatrix) {
    var tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(this.tileDao.tileMatrixSet.getBoundingBox(), tileMatrix.matrix_width, tileMatrix.matrix_height, tileMatrixProjectionBoundingBox);
    return this.tileDao.queryByTileGrid(tileGrid, tileMatrix.zoom_level);
  } else {
    return Promise.resolve();
  }
};
