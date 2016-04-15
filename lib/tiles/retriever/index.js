
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
  var tile;
  var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  this.getTileMatrixWithWebMercatorBoundingBox(webMercatorBoundingBox, function(err, tileMatrix) {
    if (err || !tileMatrix) return callback();
    var tileWidth = tileMatrix.tileWidth;
    var tileHeight = tileMatrix.tileHeight;

    this.retrieveTileResults(webMercatorBoundingBox, tileMatrix, function(err, theTile) {
      // tile = theTile;

      // to get one buffer byte
      // [row * tileWidth + column]

      // oneDim[row * columns + column]

      // var tileRow = this.tileDao.getTileRow(tile);
      //
      this.getWebMercatorBoundingBox(function(err, box) {
        var tileWebMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(box, tileMatrix, theTile.tile_column, theTile.tile_row);

        var overlap = TileBoundingBoxUtils.overlapWithBoundingBox(webMercatorBoundingBox, tileWebMercatorBoundingBox);
        if (overlap) {

          // console.log('the overlap is', overlap);

          var xOffset = Math.round(TileBoundingBoxUtils.getXPixelOffset(tileWidth,webMercatorBoundingBox, tileWebMercatorBoundingBox.minLongitude));
          var yOffset = Math.round(TileBoundingBoxUtils.getYPixelOffset(tileHeight, webMercatorBoundingBox, tileWebMercatorBoundingBox.maxLatitude));
          console.log('xOffset', xOffset);
          console.log('yOffset', yOffset);
          if (xOffset <= -tileHeight || xOffset >= tileHeight || yOffset <= -tileWidth || yOffset >= tileWidth) {
            // this tile doesn't belong just skip it
          } else {
            // return the tile
            tile = theTile;
          }
        }
      }.bind(this));

    }.bind(this), function(err) {
      callback(err, tile);
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
