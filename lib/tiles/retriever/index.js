
var TileMatrixSetDao = require('../matrixset').TileMatrixSetDao
  , TileBoundingBoxUtils = require('../tileBoundingBoxUtils');

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
      this.setWebMercatorBoundingBox = this.setProjectionBoundingBox.projectBoundingBox(srs.definition, 'EPSG:3857');
      callback(null, this.setWebMercatorBoundingBox);
    }.bind(this));
  }
};

GeoPackageTileRetriever.prototype.hasTile = function (x, y, zoom, callback) {
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  var tileMatrix = this.getTileMatrixWithWebMercatorBoundingBox(webMercatorBoundingBox);
  var tileResults = [];
  this.retrieveTileResults(webMercatorBoundingBox, tileMatrix, function(err, result) {
    tileResults.push(result);
  }, function(err) {
    if(tileResults && tileResults.length > 0) {
      return callback(err, true);
    }
    callback(err, false);
  });

};

GeoPackageTileRetriever.prototype.getTile = function (x, y, zoom, callback) {
  var tile;
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  this.getTileMatrixWithWebMercatorBoundingBox(webMercatorBoundingBox, function(err, tileMatrix) {
    var tileWidth = tileMatrix.tileWidth;
    var tileHeight = tileMatrix.tileHeight;

    this.retrieveTileResults(webMercatorBoundingBox, tileMatrix, function(err, tile) {
      var tileRow = this.tileDao.getTileRow(tile);

      this.getWebMercatorBoundingBox(function(err, box) {
        var tileWebMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(box, tileMatrix, tile.tile_column, tile.tile_row);

        var overlap = TileBoundingBoxUtils.overlapWithBoundingBox(webMercatorBoundingBox, tileWebMercatorBoundingBox);
        if (overlap) {
          callback(err, tile);
        }
      }.bind(this));

    }.bind(this), function(err) {
      console.log('done');
      // callback(err, tile);
    });
  }.bind(this));
};

GeoPackageTileRetriever.prototype.getTileMatrixWithWebMercatorBoundingBox = function (webMercatorBoundingBox, callback) {
  var tileMatrix;
  this.getWebMercatorBoundingBox(function(err, setWebMercatorBoundingBox) {
    var overlap = TileBoundingBoxUtils.overlapWithBoundingBox(webMercatorBoundingBox, setWebMercatorBoundingBox);
    if(overlap) {
      var distance = webMercatorBoundingBox.maxLongitude - webMercatorBoundingBox.minLongitude;
      var zoomLevel = this.tileDao.getZoomLevelWithLength(distance);

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
