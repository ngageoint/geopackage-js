/**
 * tileDao module.
 * @module tiles/user/tileDao
 */

var UserDao = require('../../user/UserDao')
  , TileGrid = require('../tileGrid')
  , TileRow = require('./tileRow')
  , TileMatrixSetDao = require('../matrixset').TileMatrixSetDao
  , BoundingBoxUtils = require('../tileBoundingBoxUtils')
  , ColumnValues = require('../../dao/columnValues')
  , TileTable = require('./tileTable')
  , TileDaoUtils = require('./tileDaoUtils');

var util = require('util')
  , proj4 = require('proj4')
  , async = require('async');

/**
 * Initialize
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
    this.minZoom = this.tileMatrices[0].zoomLevel;
    this.maxZoom = this.tileMatrices[this.tileMatrices.length-1].zoomLevel;
  }

  // Populate the zoom level to tile matrix and the sorted tile widths and heights
  for (var i = this.tileMatrices.length-1; i >= 0; i--) {
    var tileMatrix = this.tileMatrices[i];
    this.zoomLevelToTileMatrix[tileMatrix.zoomLevel] = tileMatrix;
  }

  this.initialize(callback);
}

util.inherits(TileDao, UserDao);

TileDao.prototype.initialize = function(callback) {
  var tileMatrixSetDao = this.getTileMatrixSetDao();
  tileMatrixSetDao.getSrs(this.tileMatrixSet, function(err, srs) {
    if (srs.definition && srs.definition !== 'undefined') {
      try {
        this.projection = proj4(srs.definition);
      } catch (e) {
        this.projection = proj4(srs.organization + ':' + srs.organizationCoordsysId);
      }
    } else {
      this.projection = proj4(srs.organization + ':' + srs.organizationCoordsysId);
    }

    // Populate the zoom level to tile matrix and the sorted tile widths and heights
    for (var i = this.tileMatrices.length-1; i >= 0; i--) {
      var tileMatrix = this.tileMatrices[i];

      var width = tileMatrix.pixelXSize * parseInt(tileMatrix.tileWidth);
      var height = tileMatrix.pixelYSize * parseInt(tileMatrix.tileHeight);
      if (this.projection.to_meter) {
        width = this.projection.to_meter * tileMatrix.pixelXSize * parseInt(tileMatrix.tileWidth);
        height = this.projection.to_meter * tileMatrix.pixelYSize * parseInt(tileMatrix.tileHeight);
      }
      this.widths.push(width);
      this.heights.push(height);
    }
    callback(null, this);
  }.bind(this));
}

TileDao.prototype.createObject = function () {
  throw new Error('not implemented');
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
        boundingBox = BoundingBoxUtils.getWebMercatorBoundingBoxWithWebMercatorTotalBoundingBox(matrixSetBoundingBox, tileMatrix.matrixWidth, tileMatrix.matrixHeight, tileGrid);
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
  var where = this.buildWhereWithFieldAndValue(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
  var whereArgs = this.buildWhereArgsWithValue(zoomLevel);
  async.series({
    minX: function(callback){
      this.minOfColumn(TileTable.COLUMN_TILE_COLUMN, where, whereArgs, callback);
    }.bind(this),
    maxX: function(callback){
      this.maxOfColumn(TileTable.COLUMN_TILE_COLUMN, where, whereArgs, callback);
    }.bind(this),
    minY: function(callback){
      this.minOfColumn(TileTable.COLUMN_TILE_ROW, where, whereArgs, callback);
    }.bind(this),
    maxY: function(callback){
      this.maxOfColumn(TileTable.COLUMN_TILE_ROW, where, whereArgs, callback);
    }.bind(this)
  }, function(err, results) {
    if (err) return callback(err);
    var tileGrid;
    if (results.minX != null && results.minY != null && results.maxX != null && results.maxY != null) {
      tileGrid = new TileGrid(results.minX, results.maxX, results.minY, results.maxY);
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
    tileGrid = new TileGrid(0, parseInt(tileMatrix.matrixWidth) - 1, 0, parseInt(tileMatrix.matrixHeight) - 1);
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
  fieldValues.addColumn(TileTable.COLUMN_TILE_COLUMN, column);
  fieldValues.addColumn(TileTable.COLUMN_TILE_ROW, row);
  fieldValues.addColumn(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
  var tileRow;
  this.queryForFieldValues(fieldValues, function(err, result, rowDone) {
    tileRow = this.getTileRow(result);
    rowDone();
  }.bind(this), function() {
    callback(null, tileRow);
  });
};

TileDao.prototype.queryForTilesWithZoomLevel = function (zoomLevel, tileCallback, doneCallback) {
  this.queryForEqWithFieldAndValue(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel, function(err, result) {
    if(!tileCallback) return;
    if (err || !result) return tileCallback(err);
    tileCallback(err, this.getTileRow(result));
  }.bind(this), doneCallback);
};

/**
 * Query for Tiles at a zoom level in descending row and column order
 * @param  {Number} zoomLevel    zoom level
 * @param  {Function} tileCallback callback for each tile
 * @param  {Function} doneCallback called when all tiles are retrieved
 */
TileDao.prototype.queryForTilesDescending = function (zoomLevel, tileCallback, doneCallback) {
  this.queryForEqWithField(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel, undefined, undefined, TileTable.COLUMN_TILE_COLUMN + ' DESC, ' + TileTable.COLUMN_TILE_ROW + ', DESC', function(err, result) {
    if(!tileCallback) return;
    if (err || !result) return tileCallback(err);
    tileCallback(err, this.getTileRow(result));
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
  fieldValues.addColumn(TileTable.COLUMN_TILE_COLUMN, column);
  fieldValues.addColumn(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);

  this.queryForFieldValues(fieldValues, function(err, result, rowDone) {
    if(!tileCallback) return;
    if (err || !result) return tileCallback(err);
    tileCallback(err, this.getTileRow(result));
    rowDone();
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
  fieldValues.addColumn(TileTable.COLUMN_TILE_ROW, row);
  fieldValues.addColumn(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);

  this.queryForFieldValues(fieldValues, function(err, result, rowDone) {
    if(!tileCallback) return;
    if (err || !result) return tileCallback(err);
    tileCallback(err, this.getTileRow(result));
    rowDone();
  }.bind(this), doneCallback);
};

/**
 * Get the zoom level for the provided width and height in the default units
 * @param  {Number} length length in meters
 * @return {Number}        zoom level
 */
TileDao.prototype.getZoomLevelWithLength = function (length) {
  return TileDaoUtils.getZoomLevel(this.widths, this.heights, this.tileMatrices, length);
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

  var x = tileGrid.minX;

  async.whilst(
    function() {
      return x <= tileGrid.maxX;
    }, function(xCallback) {
      var y = tileGrid.minY;
      async.whilst(
        function() {
          return y <= tileGrid.maxY;
        },
        function(yCallback) {
          var where = '';
          where += this.buildWhereWithFieldAndValue(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
          where += ' and ';
          where += this.buildWhereWithFieldAndValueAndOperation(TileTable.COLUMN_TILE_COLUMN, x, '=');
          where += ' and ';
          where += this.buildWhereWithFieldAndValueAndOperation(TileTable.COLUMN_TILE_ROW, y, '=');
          var whereArgs = this.buildWhereArgsWithValueArray([zoomLevel, x, y]);

          this.queryWhereWithArgsDistinct(where, whereArgs, function(err, result, rowDone) {
            if(!tileCallback) return yCallback();
            if (err || !result) return yCallback(err);
            tileCallback(err, this.getTileRow(result));
            rowDone();
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
    doneCallback
  );

  // var where = '';
  // where += this.buildWhereWithFieldAndValue(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
  // where += ' and ';
  // where += this.buildWhereWithFieldAndValueAndOperation(TileTable.COLUMN_TILE_COLUMN, tileGrid.minX, '>=');
  // where += ' and ';
  // where += this.buildWhereWithFieldAndValueAndOperation(TileTable.COLUMN_TILE_COLUMN, tileGrid.maxX, '<=');
  // where += ' and ';
  // where += this.buildWhereWithFieldAndValueAndOperation(TileTable.COLUMN_TILE_ROW, tileGrid.minY, '>=');
  // where += ' and ';
  // where += this.buildWhereWithFieldAndValueAndOperation(TileTable.COLUMN_TILE_ROW, tileGrid.maxY, '<=');
  //
  // var whereArgs = this.buildWhereArgsWithValueArray([zoomLevel, tileGrid.minX, tileGrid.maxX, tileGrid.minY, tileGrid.maxY]);
  //
  // this.queryWhereWithArgsDistinct(where, whereArgs, function(err, result, rowDone) {
  //   if(!tileCallback) return;
  //   if (err || !result) return tileCallback(err);
  //   tileCallback(err, this.getTileRow(result));
  //   rowDone();
  // }.bind(this), doneCallback);
};


// /**
//  *  Query for the bounding tile grid with tiles at the zoom level
//  *
//  *  @param zoomLevel zoom level
//  *
//  *  @return tile grid of tiles at the zoom level
//  */
// -(GPKGTileGrid *) queryForTileGridWithZoomLevel: (int) zoomLevel;
//
// /**
//  *  Delete a Tile
//  *
//  *  @param column    column
//  *  @param row       row
//  *  @param zoomLevel zoom level
//  *
//  *  @return number deleted, should be 0 or 1
//  */
// -(int) deleteTileWithColumn: (int) column andRow: (int) row andZoomLevel: (int) zoomLevel;
//
// /**
//  *  Count of Tiles at a zoom level
//  *
//  *  @param zoomLevel zoom level
//  *
//  *  @return count
//  */
// -(int) countWithZoomLevel: (int) zoomLevel;
//
// /**
//  *  Determine if the tiles are in the standard web mercator coordinate tile format
//  *
//  *  @return true if standard web mercator format
//  */
// -(BOOL) isStandardWebMercatorFormat;

TileDao.prototype.getTileMatrixSetDao = function () {
  return new TileMatrixSetDao(this.connection);
};

module.exports = TileDao;
