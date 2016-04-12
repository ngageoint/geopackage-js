
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
    console.log('tile matrix set srsId', tileMatrixSet.srsId);
    tileMatrixSetDao.getSrs(tileMatrixSet, function(err, srs) {
      console.log('srs', srs);
      this.setProjectionBoundingBox = tileMatrixSet.getBoundingBox();
      console.log('set projection bounding box', this.setProjectionBoundingBox);
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
  console.log('webMercatorBoundingBox', webMercatorBoundingBox);
  this.getTileMatrixWithWebMercatorBoundingBox(webMercatorBoundingBox, function(err, tileMatrix) {
    var tileWidth = tileMatrix.tileWidth;
    var tileHeight = tileMatrix.tileHeight;

    this.retrieveTileResults(webMercatorBoundingBox, tileMatrix, function(err, tile) {
      console.log('tile', tile);
    }, function(err) {
      console.log('done');
    });
  });
};

GeoPackageTileRetriever.prototype.getTileMatrixWithWebMercatorBoundingBox = function (webMercatorBoundingBox, callback) {
  var tileMatrix;
  this.getWebMercatorBoundingBox(function(err, setWebMercatorBoundingBox) {
    var overlap = TileBoundingBoxUtils.overlapWithBoundingBox(webMercatorBoundingBox, setWebMercatorBoundingBox);
    console.log('overlap', overlap);
    if(overlap) {
      var distance = webMercatorBoundingBox.maxLongitude - webMercatorBoundingBox.minLongitude;
      var zoomLevel = this.tileDao.getZoomLevelWithLength(distance);
      console.log('zoom level', zoomLevel);

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
      TileDao.prototype.queryByTileGrid(tileGrid, tileMatrix.zoomLevel, tileCallback, doneCallback);
    });
  } else {
    doneCallback();
  }
};
