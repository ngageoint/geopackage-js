/**
 * @module tiles/user/tileTable
 */

const UserTable = require('../../user/userTable');
const TileColumn = require('./tileColumn');
const util = require('util');

/**
 * `TileTable` models [tile pyramid user tables](https://www.geopackage.org/spec121/index.html#tiles_user_tables).
 *
 * @class
 * @extends {module:user/userTable~UserTable}
 * @param {string} tableName
 * @param {module:tiles/user/tileColumn~TileColumn[]} columns
 */
var TileTable = module.exports = function(tableName, columns) {
  UserTable.call(this, tableName, columns);

  var zoomLevel;
  var tileColumn;
  var tileRow;
  var tileData;
  var uniqueColumns = [];

  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    var columnName = column.name;
    var columnIndex = column.index;

    switch(columnName) {
      case TileColumn.COLUMN_ZOOM_LEVEL:
      this.duplicateCheck(columnIndex, zoomLevel, TileColumn.COLUMN_ZOOM_LEVEL);
      zoomLevel = columnIndex;
      uniqueColumns.push(column);
      break;
      case TileColumn.COLUMN_TILE_COLUMN:
      this.duplicateCheck(columnIndex, tileColumn, TileColumn.COLUMN_TILE_COLUMN);
      tileColumn = columnIndex;
      uniqueColumns.push(column);
      break;
      case TileColumn.COLUMN_TILE_ROW:
      this.duplicateCheck(columnIndex, tileRow, TileColumn.COLUMN_TILE_ROW);
      tileRow = columnIndex;
      uniqueColumns.push(column);
      break;
      case TileColumn.COLUMN_TILE_DATA:
      this.duplicateCheck(columnIndex, tileData, TileColumn.COLUMN_TILE_DATA);
      tileData = columnIndex;
      break;
    }
  }

  this.uniqueConstraints = [{columns: uniqueColumns}];

  this.missingCheck(zoomLevel, TileColumn.COLUMN_ZOOM_LEVEL);
  this.zoomLevelIndex = zoomLevel;

  this.missingCheck(tileColumn, TileColumn.COLUMN_TILE_COLUMN);
  this.tileColumnIndex = tileColumn;

  this.missingCheck(tileRow, TileColumn.COLUMN_TILE_ROW);
  this.tileRowIndex = tileRow;

  this.missingCheck(tileData, TileColumn.COLUMN_TILE_DATA);
  this.tileDataIndex = tileData;
}

util.inherits(TileTable, UserTable);

TileTable.prototype.getZoomLevelColumn = function() {
  return this.getColumnWithIndex(this.zoomLevelIndex);
};

TileTable.prototype.getTileColumnColumn = function() {
  return this.getColumnWithIndex(this.tileColumnIndex);
};

TileTable.prototype.getRowColumn = function() {
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
