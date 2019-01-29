/**
 * @module tiles/user/tileColumn
 */

const UserColumn = require('../../user/userColumn');
const DataTypes = require('../../db/dataTypes');
const util = require('util');

/**
 * `TileColumn` models columns in [user tile pyramid tables]{@link module:tiles/user/tileTable~TileTable}.
 *
 * @class
 * @extends {module:user/userColumn~UserColumn}
 */
var TileColumn = function(index, name, dataType, max, notNull, defaultValue, primaryKey) {
  UserColumn.call(this, index, name, dataType, max, notNull, defaultValue, primaryKey);
  if (dataType === DataTypes.GPKG_DT_GEOMETRY) {
    throw new Error('Data Type is required to create column: ' + name);
  }
}

util.inherits(TileColumn, UserColumn);

/**
 * Create an id column
 * @param  {number} index Index
 */
TileColumn.createIdColumn = function(index) {
  return new TileColumn(index, TileColumn.COLUMN_ID, DataTypes.GPKGDataType.GPKG_DT_INTEGER, null, false, null, true);
}

/**
 * Create a zoom level column
 * @param  {number} index Index
 */
TileColumn.createZoomLevelColumn = function(index) {
  return new TileColumn(index, TileColumn.COLUMN_ZOOM_LEVEL, DataTypes.GPKGDataType.GPKG_DT_INTEGER, null, true, null, false);
}

/**
 *  Create a tile column column
 *
 *  @param {number} index column index
 */
TileColumn.createTileColumnColumn = function(index) {
  return new TileColumn(index, TileColumn.COLUMN_TILE_COLUMN, DataTypes.GPKGDataType.GPKG_DT_INTEGER, null, true, null, false);
}

/**
 *  Create a tile row column
 *
 *  @param {number} index column index
 *
 */
TileColumn.createTileRowColumn = function(index) {
  return new TileColumn(index, TileColumn.COLUMN_TILE_ROW, DataTypes.GPKGDataType.GPKG_DT_INTEGER, null, true, null, false);
}

/**
 *  Create a tile data column
 *
 *  @param {number} index column index
 */
TileColumn.createTileDataColumn = function(index) {
  return new TileColumn(index, TileColumn.COLUMN_TILE_DATA, DataTypes.GPKGDataType.GPKG_DT_BLOB, null, true, null, false);
}

TileColumn.COLUMN_ID = "id";
TileColumn.COLUMN_ZOOM_LEVEL = "zoom_level";
TileColumn.COLUMN_TILE_COLUMN = "tile_column";
TileColumn.COLUMN_TILE_ROW = "tile_row";
TileColumn.COLUMN_TILE_DATA = "tile_data";

module.exports = TileColumn;
