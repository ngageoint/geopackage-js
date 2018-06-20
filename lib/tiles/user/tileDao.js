/**
 * tileDao module.
 * @module tiles/user/tileDao
 */

var UserDao = require('../../user/userDao')
  , TileGrid = require('../tileGrid')
  , TileRow = require('./tileRow')
  , TileMatrixSetDao = require('../matrixset').TileMatrixSetDao
  , ContentsDao = require('../../core/contents').ContentsDao
  , BoundingBoxUtils = require('../tileBoundingBoxUtils')
  , ColumnValues = require('../../dao/columnValues')
  , TileColumn = require('./tileColumn')
  , TileDaoUtils = require('./tileDaoUtils');

var util = require('util')
  , proj4 = require('proj4')
  , async = require('async');

proj4 = 'default' in proj4 ? proj4['default'] : proj4;

/**
 * Tile DAO for reading tile user tables
 * @class TileDao
 * @extends {module:user/userDao~UserDao}
 * @param  {GeoPackageConnection} connection              database connection
 * @param  {TileTable} table           feature table
 * @param  {TileMatrixSet} tileMatrixSet tile matrix set
 * @param  {Array} tileMatrices      tile matrices
 * @param  {Function} callback  called when the tile is initialized
 */
var TileDao = function(connection, table, tileMatrixSet, tileMatrices, callback) {
  UserDao.call(this, connection, table);

  this.connection = connection;
  this.tileMatrixSet = tileMatrixSet;
  this.tileMatrices = tileMatrices;
  this.zoomLevelToTileMatrix = [];
  this.widths = [];
  this.heights = [];

  if (tileMatrices.length === 0) {
    this.minZoom = 0;
    this.maxZoom = 0;
  } else {
    this.minZoom = this.tileMatrices[0].zoom_level;
    this.maxZoom = this.tileMatrices[this.tileMatrices.length-1].zoom_level;
  }

  // Populate the zoom level to tile matrix and the sorted tile widths and heights
  for (var i = this.tileMatrices.length-1; i >= 0; i--) {
    var tileMatrix = this.tileMatrices[i];
    this.zoomLevelToTileMatrix[tileMatrix.zoom_level] = tileMatrix;
  }

  this.initialize(callback);
}

util.inherits(TileDao, UserDao);

TileDao.prototype.initialize = function(callback) {
  var tileMatrixSetDao = this.getTileMatrixSetDao();
  tileMatrixSetDao.getSrs(this.tileMatrixSet, function(err, srs) {
    this.srs = srs;
    this.projection = srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id;

    // Populate the zoom level to tile matrix and the sorted tile widths and heights
    for (var i = this.tileMatrices.length-1; i >= 0; i--) {
      var tileMatrix = this.tileMatrices[i];

      var width = tileMatrix.pixel_x_size * tileMatrix.tile_width;
      var height = tileMatrix.pixel_y_size * tileMatrix.tile_height;
      var proj4Projection = proj4(this.projection);
      if (proj4Projection.to_meter) {
        width = proj4Projection.to_meter * tileMatrix.pixel_x_size * tileMatrix.tile_width;
        height = proj4Projection.to_meter * tileMatrix.pixel_y_size * tileMatrix.tile_height;
      }
      this.widths.push(width);
      this.heights.push(height);
    }
    this.setWebMapZoomLevels();
    callback(null, this);
  }.bind(this));
}

TileDao.prototype.createObject = function () {
  throw new Error('not implemented');
};

TileDao.prototype.webZoomToGeoPackageZoom = function(webZoom) {
  var webMercatorBoundingBox = BoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(0, 0, webZoom);
  return this.determineGeoPackageZoomLevel(webMercatorBoundingBox, webZoom);
}

TileDao.prototype.setWebMapZoomLevels = function() {
  this.minWebMapZoom;
  this.maxWebMapZoom;
  for (var zoom = 0; zoom < 20; zoom++) {
    var gpZoom = this.webZoomToGeoPackageZoom(zoom);
    if (gpZoom == this.minZoom) this.minWebMapZoom = zoom;
    if (gpZoom == this.maxZoom && (!this.maxWebMapZoom || this.minWebMapZoom == zoom)) {
      this.maxWebMapZoom = zoom;
    }
  }
}

function precision(a) {
  if (!isFinite(a)) return 0;
  var e = 1, p = 0;
  while (Math.round(a * e) / e !== a) { e *= 10; p++; }
  return p;
}

TileDao.prototype.determineGeoPackageZoomLevel = function(webMercatorBoundingBox, zoom) {
  // find width and height of this tile in geopackage projection
  var proj4Projection = proj4(this.projection, 'EPSG:3857');
  var ne = proj4Projection.inverse([webMercatorBoundingBox.maxLongitude, webMercatorBoundingBox.maxLatitude]);
  var sw = proj4Projection.inverse([webMercatorBoundingBox.minLongitude, webMercatorBoundingBox.minLatitude]);
  var width = (ne[0] - sw[0]);
  var height = (ne[1] - sw[1]);
  var gpZoom = this.maxZoom;
  // find the closest zoom for width
  for (var i = 0; i < this.widths.length; i++) {
    var tileWidth = this.widths[i];
    var difference = Math.abs(width - tileWidth);
    var tolerance = 2*(1/(Math.pow(10,Math.max(1,(precision(tileWidth)-5)))));
    if (tileWidth <= width || difference <= tolerance) {
      gpZoom = this.maxZoom - i;
    }
  }
  return gpZoom;
};

/**
 * Get the bounding box of tiles at the zoom level
 * @param  {Number} zoomLevel zoom level
 * @return {BoundingBox}           bounding box of the zoom level, or null if no tiles
 */
TileDao.prototype.getBoundingBoxWithZoomLevel = function (zoomLevel, callback) {
  var boundingBox;

  var tileMatrix = this.getTileMatrixWithZoomLevel(zoomLevel);
  if (tileMatrix) {
    this.queryForTileGridWithZoomLevel(zoomLevel, function(err, tileGrid) {

      if (tileGrid) {
        var matrixSetBoundingBox = this.getBoundingBox();
        boundingBox = BoundingBoxUtils.getTileGridBoundingBox(matrixSetBoundingBox, tileMatrix.matrix_width, tileMatrix.matrix_height, tileGrid);
      }
      callback(err, boundingBox);
    }.bind(this));
  } else {
    callback(null, boundingBox);
  }
};

TileDao.prototype.getBoundingBox = function () {
  return this.tileMatrixSet.getBoundingBox();
};

TileDao.prototype.queryForTileGridWithZoomLevel = function (zoomLevel, callback) {
  var where = this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
  var whereArgs = this.buildWhereArgsWithValue(zoomLevel);
  async.series({
    min_x: function(callback){
      this.minOfColumn(TileColumn.COLUMN_TILE_COLUMN, where, whereArgs, callback);
    }.bind(this),
    max_x: function(callback){
      this.maxOfColumn(TileColumn.COLUMN_TILE_COLUMN, where, whereArgs, callback);
    }.bind(this),
    min_y: function(callback){
      this.minOfColumn(TileColumn.COLUMN_TILE_ROW, where, whereArgs, callback);
    }.bind(this),
    max_y: function(callback){
      this.maxOfColumn(TileColumn.COLUMN_TILE_ROW, where, whereArgs, callback);
    }.bind(this)
  }, function(err, results) {
    if (err) return callback(err);
    var tileGrid;
    if (results.min_x != null && results.min_y != null && results.max_x != null && results.max_y != null) {
      tileGrid = new TileGrid(results.min_x, results.max_x, results.min_y, results.max_y);
    }
    callback(err, tileGrid);
  });

};

/**
 * Get the tile grid of the zoom level
 * @param  {Number} zoomLevel zoom level
 * @return {TileGrid}           tile grid at zoom level, null if no tile matrix at zoom level
 */
TileDao.prototype.getTileGridWithZoomLevel = function (zoomLevel) {
  var tileGrid;
  var tileMatrix = this.getTileMatrixWithZoomLevel(zoomLevel);
  if (tileMatrix) {
    tileGrid = new TileGrid(0, ~~tileMatrix.matrix_width - 1, 0, ~~tileMatrix.matrix_height - 1);
  }
  return tileGrid;
};

/**
 * get the tile table
 * @return {TileTable} tile table
 */
TileDao.prototype.getTileTable = function () {
  return this.table;
};

/**
 * Get the tile row for the result
 * @param  {result} result tile row object
 * @return {TileRow}        tile row
 */
TileDao.prototype.getTileRow = function (result) {
  return this.getRow(result);
};

/**
 * Create a new tile row with the column types and values
 * @param  {Array} columnTypes column types
 * @param  {Array} values      values
 * @return {TileRow}             tile row
 */
TileDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new TileRow(this.getTileTable(), columnTypes, values);
};

/**
 * Create a new tile row
 * @return {TileRow} tile row
 */
TileDao.prototype.newRow = function () {
  return new TileRow(this.getTileTable());
};

/**
 * Adjust the tile matrix lengths if needed. Check if the tile matrix width
 * and height need to expand to account for pixel * number of pixels fitting
 * into the tile matrix lengths
 */
TileDao.prototype.adjustTileMatrixLengths = function () {
  TileDaoUtils.adjustTileMatrixLengths(this.tileMatrixSet, this.tileMatrices);
};

/**
 * Get the tile matrix at the zoom level
 * @param  {Number} zoomLevel zoom level
 * @return {TileMatrix}           tile matrix
 */
TileDao.prototype.getTileMatrixWithZoomLevel = function (zoomLevel) {
  return this.zoomLevelToTileMatrix[zoomLevel];
};

/**
 * Query for a tile
 * @param  {Number} column    column
 * @param  {Number} row       row
 * @param  {Number} zoomLevel zoom level
 * @param {Function}           callback called with an error if one occurred and the TileDao
 */
TileDao.prototype.queryForTile = function (column, row, zoomLevel, callback) {

  var fieldValues = new ColumnValues();
  fieldValues.addColumn(TileColumn.COLUMN_TILE_COLUMN, column);
  fieldValues.addColumn(TileColumn.COLUMN_TILE_ROW, row);
  fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
  var tileRow;
  this.queryForFieldValues(fieldValues, function(err, result, rowDone) {
    tileRow = this.getTileRow(result);
    rowDone();
  }.bind(this), function() {
    callback(null, tileRow);
  });
};

TileDao.prototype.queryForTilesWithZoomLevel = function (zoomLevel, tileCallback, doneCallback) {
  this.queryForEqWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel, function(err, result, rowDone) {
    if(!tileCallback) return;
    if (err || !result) return tileCallback(err);
    tileCallback(err, this.getTileRow(result), rowDone);
  }.bind(this), doneCallback);
};

/**
 * Query for Tiles at a zoom level in descending row and column order
 * @param  {Number} zoomLevel    zoom level
 * @param  {Function} tileCallback callback for each tile
 * @param  {Function} doneCallback called when all tiles are retrieved
 */
TileDao.prototype.queryForTilesDescending = function (zoomLevel, tileCallback, doneCallback) {
  this.queryForEqWithField(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel, undefined, undefined, TileColumn.COLUMN_TILE_COLUMN + ' DESC, ' + TileColumn.COLUMN_TILE_ROW + ', DESC', function(err, result, rowDone) {
    if(!tileCallback) return;
    if (err || !result) return tileCallback(err);
    tileCallback(err, this.getTileRow(result), rowDone);
  }.bind(this), doneCallback);
};

/**
 * Query for tiles at a zoom level and column
 * @param  {Number} column       column
 * @param  {Number} zoomLevel    zoom level
 * @param  {Function} tileCallback called for each tile
 * @param  {Function} doneCallback called when all tiles have been retrieved
 */
TileDao.prototype.queryForTilesInColumn = function (column, zoomLevel, tileCallback, doneCallback) {
  var fieldValues = new ColumnValues();
  fieldValues.addColumn(TileColumn.COLUMN_TILE_COLUMN, column);
  fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);

  this.queryForFieldValues(fieldValues, function(err, result, rowDone) {
    if(!tileCallback) return;
    if (err || !result) return tileCallback(err);
    tileCallback(err, this.getTileRow(result), rowDone);
  }.bind(this), doneCallback);
};

/**
 * Query for tiles at a zoom level and row
 * @param  {Number} row       row
 * @param  {Number} zoomLevel    zoom level
 * @param  {Function} tileCallback called for each tile
 * @param  {Function} doneCallback called when all tiles have been retrieved
 */
TileDao.prototype.queryForTilesInRow = function (row, zoomLevel, tileCallback, doneCallback) {
  var fieldValues = new ColumnValues();
  fieldValues.addColumn(TileColumn.COLUMN_TILE_ROW, row);
  fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);

  this.queryForFieldValues(fieldValues, function(err, result, rowDone) {
    if(!tileCallback) return;
    if (err || !result) return tileCallback(err);
    tileCallback(err, this.getTileRow(result), rowDone);
  }.bind(this), doneCallback);
};

/**
 * Query by tile grid and zoom level
 * @param  {TileGrid} tileGrid  tile grid
 * @param  {Number} zoomLevel zoom level
 * @param  {Function} tileCallback called for each tile
 * @param  {Function} doneCallback called when all tiles have been retrieved
 */
TileDao.prototype.queryByTileGrid = function (tileGrid, zoomLevel, tileCallback, doneCallback) {
  if (!tileGrid) return doneCallback();
  var tileCount = 0;
  var x = tileGrid.min_x;

  async.whilst(
    function() {
      return x <= tileGrid.max_x;
    }, function(xCallback) {
      var y = tileGrid.min_y;
      async.whilst(
        function() {
          return y <= tileGrid.max_y;
        },
        function(yCallback) {
          var where = '';
          where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
          where += ' and ';
          where += this.buildWhereWithFieldAndValueAndOperation(TileColumn.COLUMN_TILE_COLUMN, x, '=');
          where += ' and ';
          where += this.buildWhereWithFieldAndValueAndOperation(TileColumn.COLUMN_TILE_ROW, y, '=');
          var whereArgs = this.buildWhereArgsWithValueArray([zoomLevel, x, y]);

          this.queryWhereWithArgsDistinct(where, whereArgs, function(err, result, rowDone) {
            if(!tileCallback) return yCallback();
            if (err || !result) return yCallback(err);
            tileCount++;
            tileCallback(err, this.getTileRow(result), rowDone);
          }.bind(this), function() {
            y++;
            yCallback();
          });
        }.bind(this),
        function() {
          x++;
          xCallback();
        }
      );
    }.bind(this),
    function() {
      doneCallback(null, tileCount);
    }
  );
};

TileDao.prototype.deleteTile = function(column, row, zoomLevel, callback) {
  var where = '';

  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, column);
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, row);

  var whereArgs = this.buildWhereArgsWithValueArray([zoomLevel, column, row]);

  this.deleteWhere(where, whereArgs, function(err, result) {
    callback(err, result);
  });
};

TileDao.prototype.getTileMatrixSetDao = function () {
  return new TileMatrixSetDao(this.connection);
};

TileDao.prototype.getContentsDao = function () {
  return new ContentsDao(this.connection);
};

TileDao.prototype.getSrs = function(callback) {
  this.getContentsDao().getSrs(this.tileMatrixSet, callback);
};

module.exports = TileDao;
