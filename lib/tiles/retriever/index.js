
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
      this.setWebMercatorBoundingBox = this.setProjectionBoundingBox.projectBoundingBox('EPSG:3857', 'EPSG:3857');

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

    TileCreator.initialize(this.width || tileWidth, this.height || tileHeight, function(err, creator) {
      this.retrieveTileResults(webMercatorBoundingBox, tileMatrix, function(err, tile) {
        this.getWebMercatorBoundingBox(function(err, box) {
          var tileWebMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(box, tileMatrix, tile.tile_column, tile.tile_row);

          var overlap = TileBoundingBoxUtils.overlapWithBoundingBox(webMercatorBoundingBox, tileWebMercatorBoundingBox);
          if (overlap) {
            var xOffset = Math.round(TileBoundingBoxUtils.getXPixelOffset(this.width || tileWidth, webMercatorBoundingBox, tileWebMercatorBoundingBox.minLongitude));
            var yOffset = Math.round(TileBoundingBoxUtils.getYPixelOffset(this.height || tileHeight, webMercatorBoundingBox, tileWebMercatorBoundingBox.maxLatitude));
            console.log('xOffset', xOffset);
            console.log('yOffset', yOffset);
            if (xOffset <= -(this.height || tileHeight) || xOffset >= (this.height || tileHeight) || yOffset <= -(this.width || tileWidth) || yOffset >= (this.width || tileWidth)) {
              // this tile doesn't belong just skip it
            } else {
              // return the tile
              tiles.push({
                data: tile.tile_data,
                xOffset: xOffset,
                yOffset: yOffset
              });
            }
          }
        }.bind(this));

      }.bind(this), function(err) {
        async.eachSeries(tiles, function(tile, callback) {
          creator.addTile(tile.data, tile.xOffset, tile.yOffset, callback);
        }, function(err) {
          creator.getCompleteTile('png', callback);
        });
      });
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
    this.getWebMercatorBoundingBox(function(err, setWebMercatorBoundingBox) {
      var tileGrid = TileBoundingBoxUtils.getTileGridWithWebMercatorTotalBoundingBox(setWebMercatorBoundingBox, tileMatrix.matrixWidth, tileMatrix.matrixHeight, webMercatorBoundingBox);
      this.tileDao.queryByTileGrid(tileGrid, tileMatrix.zoomLevel, tileCallback, doneCallback);
    }.bind(this));
  } else {
    doneCallback();
  }
};
