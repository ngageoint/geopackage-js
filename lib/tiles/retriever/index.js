
var TileMatrixSetDao = require('../matrixset').TileMatrixSetDao
  , TileBoundingBoxUtils = require('../tileBoundingBoxUtils')
  , TileCreator = require('../creator');

var async = require('async');

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
      if (srs.organizationCoordsysId === 4326 && srs.organization === 'EPSG') {
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
  this.getTileMatrixWithWebMercatorBoundingBox(webMercatorBoundingBox, function(err, tileMatrix) {
    var tileResults = [];
    this.retrieveTileResults(webMercatorBoundingBox, tileMatrix, function(err, result) {
      tileResults.push(result);
    }, function(err) {
      if(tileResults && tileResults.length > 0) {
        return callback(err, true);
      }
      callback(err, false);
    });
  }.bind(this));
};

GeoPackageTileRetriever.prototype.getTile = function (x, y, zoom, callback) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  this.getTileWithBounds(webMercatorBoundingBox, zoom, callback);
};

GeoPackageTileRetriever.prototype.getTileWithWgs84Bounds = function (wgs84BoundingBox, zoom, callback) {
  var webMercatorBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');
  this.getTileWithBounds(webMercatorBoundingBox, zoom, callback);
};

GeoPackageTileRetriever.prototype.getTileWithBounds = function (webMercatorBoundingBox, zoom, callback) {
  var tiles = [];
  this.getTileMatrixWithWebMercatorBoundingBox(webMercatorBoundingBox, zoom, function(err, tileMatrix) {
    if (err || !tileMatrix) return callback();
    var tileWidth = tileMatrix.tileWidth;
    var tileHeight = tileMatrix.tileHeight;

    var boundingBoxReproject = webMercatorBoundingBox.projectBoundingBox('EPSG:3857', this.tileDao.projection);
    var matrixSetProjectionToWebMercator = this.tileDao.tileMatrixSet.getBoundingBox().projectBoundingBox(this.tileDao.projection, 'EPSG:3857');
    var tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(matrixSetProjectionToWebMercator, tileMatrix.matrixWidth, tileMatrix.matrixHeight, webMercatorBoundingBox);

    var matrixSetBoundingBox = this.tileDao.tileMatrixSet.getBoundingBox();

    var bb;

    TileCreator.initialize(this.width || tileWidth, this.height || tileHeight, tileMatrix, this.tileDao.tileMatrixSet, webMercatorBoundingBox, this.tileDao.projection, 'EPSG:3857', function(err, creator) {

      this.retrieveTileResults(webMercatorBoundingBox, tileMatrix, function(err, tile) {
        console.log('tile', tile);
        this.getWebMercatorBoundingBox(function(err, box) {

          var tileWebMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(box, tileMatrix, tile.getTileColumn(), tile.getTileRow());
          var tileBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(matrixSetBoundingBox, tileMatrix, tile.getTileColumn(), tile.getTileRow());

          bb = bb || tileBoundingBox;
          bb.minLatitude = Math.min(bb.minLatitude, tileBoundingBox.minLatitude);
          bb.maxLatitude = Math.max(bb.maxLatitude, tileBoundingBox.maxLatitude);
          bb.minLongitude = Math.min(bb.minLongitude, tileBoundingBox.minLongitude);
          bb.maxLongitude = Math.max(bb.maxLongitude, tileBoundingBox.maxLongitude);

          var overlap = TileBoundingBoxUtils.overlapWithBoundingBox(webMercatorBoundingBox, tileWebMercatorBoundingBox);
          console.log('overlap', overlap);
          if (overlap) {
            tiles.push({
              data: tile.getTileData(),
              gridColumn: tile.getTileColumn(),
              gridRow: tile.getTileRow()
            });
          }
        }.bind(this));
      }.bind(this), function(err) {
        console.log('done');
        async.eachSeries(tiles, function(tile, callback) {
          creator.addTile(tile.data, tile.gridColumn, tile.gridRow, callback);
        }, function(err) {
          creator.getCompleteTile('png', 'EPSG:3857', this.tileDao.projection, bb, webMercatorBoundingBox, callback);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

GeoPackageTileRetriever.prototype.getTileMatrixWithWebMercatorBoundingBox = function (webMercatorBoundingBox, zoom, callback) {
  if (!callback) {
    callback = zoom;
    zoom = undefined;
  }
  var tileMatrix;
  this.getWebMercatorBoundingBox(function(err, setWebMercatorBoundingBox) {
    var overlap = TileBoundingBoxUtils.overlapWithBoundingBox(webMercatorBoundingBox, setWebMercatorBoundingBox);
    if(overlap) {
      var distance = webMercatorBoundingBox.maxLongitude - webMercatorBoundingBox.minLongitude;
      var zoomLevel = zoom;
      if (zoom === undefined || zoom === null) {
        zoomLevel = this.tileDao.getZoomLevelWithLength(distance);
      }

      if(zoomLevel !== undefined && zoomLevel !== null) {
        tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoomLevel);
      }
    }

    callback(null, tileMatrix);
  }.bind(this));
};

GeoPackageTileRetriever.prototype.retrieveTileResults = function (webMercatorBoundingBox, tileMatrix, tileCallback, doneCallback) {
  if(tileMatrix) {
    // project the web mercator bounding box into the projection of the matrix
    var boundingBoxReproject = webMercatorBoundingBox.projectBoundingBox('EPSG:3857', this.tileDao.projection);
    var matrixSetProjectionToWebMercator = this.tileDao.tileMatrixSet.getBoundingBox().projectBoundingBox(this.tileDao.projection, 'EPSG:3857');
    var tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(matrixSetProjectionToWebMercator, tileMatrix.matrixWidth, tileMatrix.matrixHeight, webMercatorBoundingBox);
      this.tileDao.queryByTileGrid(tileGrid, tileMatrix.zoomLevel, tileCallback, doneCallback);
  } else {
    doneCallback();
  }
};
