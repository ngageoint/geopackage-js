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
  , BoundingBox = require('../../boundingBox')
  , ColumnValues = require('../../dao/columnValues')
  , TileColumn = require('./tileColumn')
  , TileDaoUtils = require('./tileDaoUtils');

var util = require('util')
  , proj4 = require('proj4');

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
var TileDao = function(geoPackage, table, tileMatrixSet, tileMatrices) {
  UserDao.call(this, geoPackage, table);

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

  this.initialize();
}

util.inherits(TileDao, UserDao);

TileDao.prototype.initialize = function() {
  var tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
  this.srs = tileMatrixSetDao.getSrs(this.tileMatrixSet);
  this.projection = this.srs.organization.toUpperCase() + ':' + this.srs.organization_coordsys_id;

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
}

TileDao.prototype.webZoomToGeoPackageZoom = function(webZoom) {
  var webMercatorBoundingBox = BoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(0, 0, webZoom);
  return this.determineGeoPackageZoomLevel(webMercatorBoundingBox, webZoom);
}

TileDao.prototype.setWebMapZoomLevels = function() {
  this.minWebMapZoom = 20;
  this.maxWebMapZoom = 0;

  this.webZoomToGeoPackageZooms = {};

  var totalTileWidth = this.tileMatrixSet.max_x - this.tileMatrixSet.min_x;
  var totalTileHeight = this.tileMatrixSet.max_y - this.tileMatrixSet.min_y;
  for (var i = 0; i < this.tileMatrices.length; i++) {
    var tileMatrix = this.tileMatrices[i];
    var singleTileWidth = totalTileWidth / tileMatrix.matrix_width;
    var singleTileHeight = totalTileHeight / tileMatrix.matrix_height;
    var tileBox = new BoundingBox(this.tileMatrixSet.min_x, this.tileMatrixSet.min_x + singleTileWidth, this.tileMatrixSet.min_y, this.tileMatrixSet.min_y + singleTileHeight);
    var proj4Projection = proj4(this.projection, 'EPSG:4326');
    var ne = proj4Projection.forward([tileBox.maxLongitude, tileBox.maxLatitude]);
    var sw = proj4Projection.forward([tileBox.minLongitude, tileBox.minLatitude]);
    var width = (ne[0] - sw[0]);
    var height = (ne[1] - sw[1]);
    var zoom = Math.ceil(Math.log2(360/width));
    if (this.minWebMapZoom > zoom) {
      this.minWebMapZoom = zoom;
    }
    if (this.maxWebMapZoom < zoom) {
      this.maxWebMapZoom = zoom;
    }
    this.webZoomToGeoPackageZooms[zoom] = tileMatrix.zoom_level;
  }
}

function precision(a) {
  if (!isFinite(a)) return 0;
  var e = 1, p = 0;
  while (Math.round(a * e) / e !== a) { e *= 10; p++; }
  return p;
}

TileDao.prototype.determineGeoPackageZoomLevel = function(webMercatorBoundingBox, zoom) {
  return this.webZoomToGeoPackageZooms[zoom];
};

/**
 * Get the bounding box of tiles at the zoom level
 * @param  {Number} zoomLevel zoom level
 * @return {BoundingBox}           bounding box of the zoom level, or null if no tiles
 */
TileDao.prototype.getBoundingBoxWithZoomLevel = function (zoomLevel) {
  var boundingBox;

  var tileMatrix = this.getTileMatrixWithZoomLevel(zoomLevel);
  if (tileMatrix) {
    var tileGrid = this.queryForTileGridWithZoomLevel(zoomLevel);
    if (tileGrid) {
      var matrixSetBoundingBox = this.getBoundingBox();
      boundingBox = BoundingBoxUtils.getTileGridBoundingBox(matrixSetBoundingBox, tileMatrix.matrix_width, tileMatrix.matrix_height, tileGrid);
    }
    return boundingBox;
  } else {
    return boundingBox;
  }
};

TileDao.prototype.getBoundingBox = function () {
  return this.tileMatrixSet.getBoundingBox();
};

TileDao.prototype.queryForTileGridWithZoomLevel = function (zoomLevel) {
  var where = this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
  var whereArgs = this.buildWhereArgs(zoomLevel);
  var minX = this.minOfColumn(TileColumn.COLUMN_TILE_COLUMN, where, whereArgs);
  var maxX = this.maxOfColumn(TileColumn.COLUMN_TILE_COLUMN, where, whereArgs);
  var minY = this.minOfColumn(TileColumn.COLUMN_TILE_ROW, where, whereArgs);
  var maxY = this.maxOfColumn(TileColumn.COLUMN_TILE_ROW, where, whereArgs);
  var tileGrid;
  if (minX != null && minY != null && maxX != null && maxY != null) {
    tileGrid = new TileGrid(minX, maxX, minY, maxY);
  }
  return tileGrid;
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
TileDao.prototype.queryForTile = function (column, row, zoomLevel) {
  var fieldValues = new ColumnValues();
  fieldValues.addColumn(TileColumn.COLUMN_TILE_COLUMN, column);
  fieldValues.addColumn(TileColumn.COLUMN_TILE_ROW, row);
  fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
  var tileRow;
  for (var row of this.queryForFieldValues(fieldValues)) {
    tileRow = this.getRow(row);
  }
  return tileRow;
};

TileDao.prototype.queryForTilesWithZoomLevel = function (zoomLevel, tileCallback) {
  var iterator = this.queryForEach(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
  var thisgetRow = this.getRow.bind(this);
  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        return {
          value: thisgetRow(nextRow.value),
          done: false
        };
      }
      return {
        done: true
      }
    }.bind(this)
  }
};

/**
 * Query for Tiles at a zoom level in descending row and column order
 * @param  {Number} zoomLevel    zoom level
 * @param  {Function} tileCallback callback for each tile
 * @param  {Function} doneCallback called when all tiles are retrieved
 */
TileDao.prototype.queryForTilesDescending = function (zoomLevel, tileCallback) {
  var iterator = this.queryForEach(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel, undefined, undefined, TileColumn.COLUMN_TILE_COLUMN + ' DESC, ' + TileColumn.COLUMN_TILE_ROW + ', DESC');

  var thisgetRow = this.getRow.bind(this);
  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        return {
          value: thisgetRow(nextRow.value),
          done: false
        };
      }
      return {
        done: true
      }
    }.bind(this)
  };
};

/**
 * Query for tiles at a zoom level and column
 * @param  {Number} column       column
 * @param  {Number} zoomLevel    zoom level
 * @param  {Function} tileCallback called for each tile
 * @param  {Function} doneCallback called when all tiles have been retrieved
 */
TileDao.prototype.queryForTilesInColumn = function (column, zoomLevel, tileCallback) {
  var fieldValues = new ColumnValues();
  fieldValues.addColumn(TileColumn.COLUMN_TILE_COLUMN, column);
  fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);

  var iterator = this.queryForFieldValues(fieldValues);
  var thisgetRow = this.getRow.bind(this);

  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        var tileRow = thisgetRow(nextRow.value);

        return {
          value: tileRow,
          done: false
        };
      } else {
        return {
          done: true
        }
      }
    }
  }
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

  var iterator = this.queryForFieldValues(fieldValues);
  var thisgetRow = this.getRow.bind(this);

  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        var tileRow = thisgetRow(nextRow.value);

        return {
          value: tileRow,
          done: false
        };
      } else {
        return {
          done: true
        }
      }
    }
  }
};

/**
 * Query by tile grid and zoom level
 * @param  {TileGrid} tileGrid  tile grid
 * @param  {Number} zoomLevel zoom level
 * @param  {Function} tileCallback called for each tile
 * @param  {Function} doneCallback called when all tiles have been retrieved
 */
TileDao.prototype.queryByTileGrid = function (tileGrid, zoomLevel) {
  if (!tileGrid) return doneCallback();
  var tileCount = 0;
  var x = tileGrid.min_x;

  var where = '';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, tileGrid.min_x, '>=');
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, tileGrid.max_x, '<=');
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, tileGrid.min_y, '>=');
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, tileGrid.max_y, '<=');
  var whereArgs = this.buildWhereArgs([zoomLevel, tileGrid.min_x, tileGrid.max_x, tileGrid.min_y, tileGrid.max_y]);

  var iterator = this.queryWhereWithArgsDistinct(where, whereArgs);
  var thisgetRow = this.getRow.bind(this);

  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      var nextRow = iterator.next();
      if (!nextRow.done) {
        var tileRow = thisgetRow(nextRow.value);

        return {
          value: tileRow,
          done: false
        };
      } else {
        return {
          done: true
        }
      }
    }
  }
};

TileDao.prototype.deleteTile = function(column, row, zoomLevel) {
  var where = '';

  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, column);
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, row);

  var whereArgs = this.buildWhereArgs([zoomLevel, column, row]);

  return this.deleteWhere(where, whereArgs);
};

TileDao.prototype.getSrs = function() {
  return this.geoPackage.getContentsDao().getSrs(this.tileMatrixSet);
};

module.exports = TileDao;
