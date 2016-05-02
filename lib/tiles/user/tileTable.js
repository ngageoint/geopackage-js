/**
 * tileTable module.
 * @module tiles/user/tileTable
 */

var UserTable = require('../../user/userTable');

var util = require('util');

/**
 * Represents a user tile table
 * @param  {string} tableName table name
 * @param  {array} columns   feature columns
 */
var TileTable = function(tableName, columns) {
  UserTable.call(this, tableName, columns);

  var zoomLevel;
  var tileColumn;
  var tileRow;
  var tileData;

  // var uniqueConstraint = new UniqueConstraint();

  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];

    var columnName = column.name;
    var columnIndex = column.index;

    switch(columnName) {
      case TileTable.COLUMN_ZOOM_LEVEL:
      this.duplicateCheck(columnIndex, zoomLevel, TileTable.COLUMN_ZOOM_LEVEL);
      zoomLevel = columnIndex;
      break;
      case TileTable.COLUMN_TILE_COLUMN:
      this.duplicateCheck(columnIndex, tileColumn, TileTable.COLUMN_TILE_COLUMN);
      tileColumn = columnIndex;
      break;
      case TileTable.COLUMN_TILE_ROW:
      this.duplicateCheck(columnIndex, tileRow, TileTable.COLUMN_TILE_ROW);
      tileRow = columnIndex;
      break;
      case TileTable.COLUMN_TILE_DATA:
      this.duplicateCheck(columnIndex, tileData, TileTable.COLUMN_TILE_DATA);
      tileData = columnIndex;
      break;
    }
  }

  this.missingCheck(zoomLevel, TileTable.COLUMN_ZOOM_LEVEL);
  this.zoomLevelIndex = zoomLevel;

  this.missingCheck(tileColumn, TileTable.COLUMN_TILE_COLUMN);
  this.tileColumnIndex = tileColumn;

  this.missingCheck(tileRow, TileTable.COLUMN_TILE_ROW);
  this.tileRowIndex = tileRow;

  this.missingCheck(tileData, TileTable.COLUMN_TILE_DATA);
  this.tileDataIndex = tileData;
}

util.inherits(TileTable, UserTable);

TileTable.prototype.getZoomLevelColumn = function() {
  return this.getColumnWithIndex(this.zoomLevelIndex);
};

TileTable.prototype.getTileColumnColumn = function() {
  return this.getColumnWithIndex(this.tileColumnIndex);
};

TileTable.prototype.getTileRowColumn = function() {
  return this.getColumnWithIndex(this.tileRowIndex);
};

TileTable.prototype.getTileDataColumn = function() {
  return this.getColumnWithIndex(this.tileDataIndex);
};

TileTable.prototype.getTableType = function() {
  return UserTable.TILE_TABLE;
}

TileTable.createRequiredColumns = function() {
  return TileTable.createRequiredColumnsWithStartingIndex(0);
}

TileTable.createRequiredColumnsWithStartingIndex = function(startingIndex) {
  var columns = [];
  columns.push(TileColumn.createIdColumn(startingIndex++));
  columns.push(TileColumn.createZoomLevelColumn(startingIndex++));
  columns.push(TileColumn.createTileColumnColumn(startingIndex++));
  columns.push(TileColumn.createTileRowColumn(startingIndex++));
  columns.push(TileColumn.createTileDataColumn(startingIndex++));
  return columns;
}

TileTable.COLUMN_ID = "id";
TileTable.COLUMN_ZOOM_LEVEL = "zoom_level";
TileTable.COLUMN_TILE_COLUMN = "tile_column";
TileTable.COLUMN_TILE_ROW = "tile_row";
TileTable.COLUMN_TILE_DATA = "tile_data";

/**
 * The TileTable
 * @type {TileTable}
 */
module.exports = TileTable;
