/**
 * @memberOf module:extension/style
 * @class IconTable
 */

var MediaTable = require('../relatedTables/mediaTable')
  , UserCustomColumn = require('../../user/custom/userCustomColumn')
  , DataType = require('../../db/dataTypes');

var util = require('util');

/**
 * Icon Requirements Class Media Table
 * @class
 * @extends {module:extension/relatedTables~MediaTable}
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @param {string[]} requiredColumns required column names
 */
var IconTable = function(tableName, columns, requiredColumns) {
  MediaTable.call(this, tableName, columns, requiredColumns);
};

util.inherits(IconTable, MediaTable);

/**
 * Create a media table with a minimum required columns followed by the additional columns
 * @return {module:extension/relatedTables~MediaTable}
 */
IconTable.create = function() {
  return new IconTable(IconTable.TABLE_NAME, IconTable.createColumns(), IconTable.requiredColumns());
};

IconTable.createRequiredColumns = function() {
  return MediaTable.createRequiredColumns();
};

/**
 * Get the required columns
 * @return {string[]}
 */
IconTable.requiredColumns = function() {
  return MediaTable.requiredColumns();
};

/**
 * Create the columns
 * @return {module:user/userColumn~UserColumn[]}
 */
IconTable.createColumns = function() {
  var columns = IconTable.createRequiredColumns();
  var index = columns.length;
  columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_NAME, DataType.GPKG_DT_TEXT_NAME, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_DESCRIPTION, DataType.GPKG_DT_TEXT_NAME, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_WIDTH, DataType.GPKG_DT_REAL_NAME, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_HEIGHT, DataType.GPKG_DT_REAL_NAME, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_ANCHOR_U, DataType.GPKG_DT_REAL_NAME, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index, IconTable.COLUMN_ANCHOR_V, DataType.GPKG_DT_REAL_NAME, undefined, false, undefined));
  return columns;
};

/**
 * Get the name column index
 * @return int
 */
IconTable.prototype.getNameColumnIndex = function() {
  return this.getColumnIndex(IconTable.COLUMN_NAME);
};

/**
 * Get the name column
 * @return {module:user/userColumn~UserColumn}
 */
IconTable.prototype.getNameColumn = function() {
  return this.getColumnWithColumnName(IconTable.COLUMN_NAME);
};

/**
 * Get the description column index
 * @return int
 */
IconTable.prototype.getDescriptionColumnIndex = function() {
  return this.getColumnIndex(IconTable.COLUMN_DESCRIPTION);
};

/**
 * Get the description column
 * @return {module:user/userColumn~UserColumn}
 */
IconTable.prototype.getDescriptionColumn = function() {
  return this.getColumnWithColumnName(IconTable.COLUMN_DESCRIPTION);
};

/**
 * Get the width column index
 * @return int
 */
IconTable.prototype.getWidthColumnIndex = function() {
  return this.getColumnIndex(IconTable.COLUMN_WIDTH);
};

/**
 * Get the width column
 * @return {module:user/userColumn~UserColumn}
 */
IconTable.prototype.getWidthColumn = function() {
  return this.getColumnWithColumnName(IconTable.COLUMN_WIDTH);
};

/**
 * Get the height column index
 * @return int
 */
IconTable.prototype.getHeightColumnIndex = function() {
  return this.getColumnIndex(IconTable.COLUMN_HEIGHT);
};

/**
 * Get the height column
 * @return {module:user/userColumn~UserColumn}
 */
IconTable.prototype.getHeightColumn = function() {
  return this.getColumnWithColumnName(IconTable.COLUMN_HEIGHT);
};

/**
 * Get the anchor_u column index
 * @return int
 */
IconTable.prototype.getAnchorUColumnIndex = function() {
  return this.getColumnIndex(IconTable.COLUMN_ANCHOR_U);
};

/**
 * Get the anchor_u column
 * @return {module:user/userColumn~UserColumn}
 */
IconTable.prototype.getAnchorUColumn = function() {
  return this.getColumnWithColumnName(IconTable.COLUMN_ANCHOR_U);
};

/**
 * Get the anchor_v column index
 * @return int
 */
IconTable.prototype.getAnchorVColumnIndex = function() {
  return this.getColumnIndex(IconTable.COLUMN_ANCHOR_V);
};

/**
 * Get the anchor_v column
 * @return {module:user/userColumn~UserColumn}
 */
IconTable.prototype.getAnchorVColumn = function() {
  return this.getColumnWithColumnName(IconTable.COLUMN_ANCHOR_V);
};

IconTable.TABLE_NAME = 'nga_icon';
IconTable.COLUMN_NAME = 'name';
IconTable.COLUMN_DESCRIPTION = 'description';
IconTable.COLUMN_WIDTH = 'width';
IconTable.COLUMN_HEIGHT = 'height';
IconTable.COLUMN_ANCHOR_U = 'anchor_u';
IconTable.COLUMN_ANCHOR_V = 'anchor_v';
IconTable.prototype.TABLE_TYPE = 'media';

module.exports = IconTable;
