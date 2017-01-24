var TileMatrixSetDao = require('../matrixset').TileMatrixSetDao
  , TileBoundingBoxUtils = require('../tileBoundingBoxUtils')
  , TileCreator = require('../creator');

var async = require('async')
  , proj4 = require('proj4');

var GeoPackageTileRetriever = function(tileDao, width, height) {
  this.tileDao = tileDao;
  this.tileDao.adjustTileMatrixLengths();

  this.width = width;
  this.height = height;
}

module.exports = GeoPackageTileRetriever;

GeoPackageTileRetriever.prototype.getWebMercatorBoundingBox = function (callback) {
  if (this.setWebMercatorBoundingBox) {
    return callback(null, this.setWebMercatorBoundingBox);
  } else {
    var tileMatrixSetDao = new TileMatrixSetDao(this.tileDao.connection);
    var tileMatrixSet = this.tileDao.tileMatrixSet;
    tileMatrixSetDao.getSrs(tileMatrixSet, function(err, srs) {
      this.setProjectionBoundingBox = tileMatrixSet.getBoundingBox();
      if (srs.organization_coordsys_id === 4326 && srs.organization === 'EPSG') {
        this.setProjectionBoundingBox.minLatitude = Math.max(this.setProjectionBoundingBox.minLatitude, -85.05);
        this.setProjectionBoundingBox.maxLatitude = Math.min(this.setProjectionBoundingBox.maxLatitude, 85.05);
      }
      this.setWebMercatorBoundingBox = this.setProjectionBoundingBox.projectBoundingBox(this.tileDao.projection, 'EPSG:3857');

      callback(null, this.setWebMercatorBoundingBox);
    }.bind(this));
  }
};

GeoPackageTileRetriever.prototype.hasTile = function (x, y, zoom, callback) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  var tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoom);
  var tileResults = [];
  this.retrieveTileResults(webMercatorBoundingBox, tileMatrix, function(err, result, done) {
    tileResults.push(result);
    done();
  }, function(err) {
    if(tileResults && tileResults.length > 0) {
      return callback(err, true);
    }
    callback(err, false);
  });
};

GeoPackageTileRetriever.prototype.getTile = function (x, y, zoom, callback) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  this.getTileWithBounds(webMercatorBoundingBox, zoom, 'EPSG:3857', callback);
};

GeoPackageTileRetriever.prototype.drawTileIn = function (x, y, zoom, canvas, callback) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  this.getTileWithBounds(webMercatorBoundingBox, zoom, 'EPSG:3857', canvas, callback);
};

GeoPackageTileRetriever.prototype.getTileWithWgs84Bounds = function (wgs84BoundingBox, zoom, callback) {
  var webMercatorBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');
  this.getTileWithBounds(webMercatorBoundingBox, zoom, 'EPSG:3857', callback);
};

GeoPackageTileRetriever.prototype.getTileWithWgs84BoundsInProjection = function (wgs84BoundingBox, zoom, targetProjection, callback) {
  var targetBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', targetProjection);
  this.getTileWithBounds(targetBoundingBox, zoom, targetProjection, callback);
};

GeoPackageTileRetriever.prototype.getWebMercatorTile = function (x, y, zoom, callback) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  this.getTileWithBounds(webMercatorBoundingBox, zoom, 'EPSG:3857', callback);
};

GeoPackageTileRetriever.prototype.getTileWithBounds = function (targetBoundingBox, zoom, targetProjection, canvas, callback) {
  if (!callback) {
    callback = canvas;
    canvas = undefined;
  }
  var tiles = [];
  var tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoom);

  var tileWidth = tileMatrix.tile_width;
  var tileHeight = tileMatrix.tile_height;

  var matrixSetBoundsInTargetProjection = this.tileDao.tileMatrixSet.getBoundingBox().projectBoundingBox(this.tileDao.projection, targetProjection);

  var matrixTotalBoundingBox = this.tileDao.tileMatrixSet.getBoundingBox();
  var targetBoundingBoxInMatrixSetProjection = targetBoundingBox.projectBoundingBox(targetProjection, this.tileDao.projection);

  var tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(matrixTotalBoundingBox, tileMatrix.matrix_width, tileMatrix.matrix_height, targetBoundingBoxInMatrixSetProjection);
  TileCreator.initialize(this.width || tileWidth, this.height || tileHeight, tileMatrix, this.tileDao.tileMatrixSet, targetBoundingBox, this.tileDao.srs, targetProjection, canvas, function(err, creator) {
    this.retrieveTileResults(targetBoundingBox.projectBoundingBox(targetProjection, this.tileDao.projection), tileMatrix, function(err, tile, tileDone) {
      // get the bounding box of the tile in the target projection
      var tileTargetProjectionBoundingBox = TileBoundingBoxUtils.getTileBoundingBox(matrixSetBoundsInTargetProjection, tileMatrix, tile.getTileColumn(), tile.getTileRow());
      tiles.push({
        data: tile.getTileData(),
        gridColumn: tile.getTileColumn(),
        gridRow: tile.getTileRow()
      });
      tileDone();
    }.bind(this), function(err) {
      async.eachSeries(tiles, function(tile, callback) {
        async.setImmediate(function() {
          creator.addTile(tile.data, tile.gridColumn, tile.gridRow, callback);
        });
      }, function(err) {
        if (!canvas) {
          return creator.getCompleteTile('png', callback);
        }
        callback();
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

GeoPackageTileRetriever.prototype.getTileMatrixWithWebMercatorBoundingBox = function (zoom) {
  return this.tileDao.getTileMatrixWithZoomLevel(zoom);
};

GeoPackageTileRetriever.prototype.retrieveTileResults = function (tileMatrixProjectionBoundingBox, tileMatrix, tileCallback, doneCallback) {
  if(tileMatrix) {
    var tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(this.tileDao.tileMatrixSet.getBoundingBox(), tileMatrix.matrix_width, tileMatrix.matrix_height, tileMatrixProjectionBoundingBox);
    this.tileDao.queryByTileGrid(tileGrid, tileMatrix.zoom_level, tileCallback, doneCallback);
  } else {
    doneCallback();
  }
};
