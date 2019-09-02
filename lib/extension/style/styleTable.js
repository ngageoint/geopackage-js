/**
 * @memberOf module:extension/style
 * @class StyleTable
 */

var AttributesTable = require('../../attributes/attributeTable')
  , UserCustomColumn = require('../../user/custom/userCustomColumn')
  , RelationType = require('../relatedTables/relationType')
  , DataTypes = require('../../db/dataTypes');

var util = require('util');

/**
 * Icon Requirements Class Media Table
 * @extends {module:attributes/attributeTable~AttributeTable}
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @constructor
 */
var StyleTable = function(tableName, columns) {
  this.data_type = RelationType.ATTRIBUTES.dataType;
  this.relation_name = RelationType.ATTRIBUTES.name;
  AttributesTable.call(this, tableName, columns);
};

util.inherits(StyleTable, AttributesTable);

/**
 * Create a media table with a minimum required columns followed by the additional columns
 * @return {module:extension/style.StyleTable}
 */
StyleTable.create = function() {
  return new StyleTable(StyleTable.TABLE_NAME, StyleTable.createColumns());
};

/**
 * Create the columns
 * @return {module:user/custom~UserCustomColumn[]}
 */
StyleTable.createColumns = function() {
  var columns = [];
  var index = 0;
  columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(index++, StyleTable.COLUMN_ID));
  columns.push(UserCustomColumn.createColumn(index++, StyleTable.COLUMN_NAME, DataTypes.GPKGDataType.GPKG_DT_TEXT, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, StyleTable.COLUMN_DESCRIPTION, DataTypes.GPKGDataType.GPKG_DT_TEXT, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, StyleTable.COLUMN_COLOR, DataTypes.GPKGDataType.GPKG_DT_TEXT, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, StyleTable.COLUMN_OPACITY, DataTypes.GPKGDataType.GPKG_DT_REAL, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, StyleTable.COLUMN_WIDTH, DataTypes.GPKGDataType.GPKG_DT_REAL, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index++, StyleTable.COLUMN_FILL_COLOR, DataTypes.GPKGDataType.GPKG_DT_TEXT, undefined, false, undefined));
  columns.push(UserCustomColumn.createColumn(index, StyleTable.COLUMN_FILL_OPACITY, DataTypes.GPKGDataType.GPKG_DT_TEXT, undefined, false, undefined));
  return columns;
};

/**
 * Get the name column index
 * @return int
 */
StyleTable.prototype.getNameColumnIndex = function() {
  return this.getColumnIndex(StyleTable.COLUMN_NAME);
};

/**
 * Get the name column
 * @return {module:user/userColumn~UserColumn}
 */
StyleTable.prototype.getNameColumn = function() {
  return this.getColumnWithColumnName(StyleTable.COLUMN_NAME);
};

/**
 * Get the description column index
 * @return int
 */
StyleTable.prototype.getDescriptionColumnIndex = function() {
  return this.getColumnIndex(StyleTable.COLUMN_DESCRIPTION);
};

/**
 * Get the description column
 * @return {module:user/userColumn~UserColumn}
 */
StyleTable.prototype.getDescriptionColumn = function() {
  return this.getColumnWithColumnName(StyleTable.COLUMN_DESCRIPTION);
};

/**
 * Get the color column index
 * @return int
 */
StyleTable.prototype.getColorColumnIndex = function() {
  return this.getColumnIndex(StyleTable.COLUMN_COLOR);
};

/**
 * Get the color column
 * @return {module:user/userColumn~UserColumn}
 */
StyleTable.prototype.getColorColumn = function() {
  return this.getColumnWithColumnName(StyleTable.COLUMN_COLOR);
};

/**
 * Get the opacity column index
 * @return int
 */
StyleTable.prototype.getOpacityColumnIndex = function() {
  return this.getColumnIndex(StyleTable.COLUMN_OPACITY);
};

/**
 * Get the opacity column
 * @return {module:user/userColumn~UserColumn}
 */
StyleTable.prototype.getOpacityColumn = function() {
  return this.getColumnWithColumnName(StyleTable.COLUMN_OPACITY);
};

/**
 * Get the width column index
 * @return int
 */
StyleTable.prototype.getWidthColumnIndex = function() {
  return this.getColumnIndex(StyleTable.COLUMN_WIDTH);
};

/**
 * Get the width column
 * @return {module:user/userColumn~UserColumn}
 */
StyleTable.prototype.getWidthColumn = function() {
  return this.getColumnWithColumnName(StyleTable.COLUMN_WIDTH);
};

/**
 * Get the fill_color column index
 * @return int
 */
StyleTable.prototype.getFillColorColumnIndex = function() {
  return this.getColumnIndex(StyleTable.COLUMN_FILL_COLOR);
};

/**
 * Get the fill_color column
 * @return {module:user/userColumn~UserColumn}
 */
StyleTable.prototype.getFillColorColumn = function() {
  return this.getColumnWithColumnName(StyleTable.COLUMN_FILL_COLOR);
};

/**
 * Get the fill_opacity column index
 * @return int
 */
StyleTable.prototype.getFillOpacityColumnIndex = function() {
  return this.getColumnIndex(StyleTable.COLUMN_FILL_OPACITY);
};

/**
 * Get the fill_opacity column
 * @return {module:user/userColumn~UserColumn}
 */
StyleTable.prototype.getFillOpacityColumn = function() {
  return this.getColumnWithColumnName(StyleTable.COLUMN_FILL_OPACITY);
};

StyleTable.TABLE_NAME = 'nga_style';
StyleTable.COLUMN_ID = 'id';
StyleTable.COLUMN_NAME = 'name';
StyleTable.COLUMN_DESCRIPTION = 'description';
StyleTable.COLUMN_COLOR = 'color';
StyleTable.COLUMN_OPACITY = 'opacity';
StyleTable.COLUMN_WIDTH = 'width';
StyleTable.COLUMN_FILL_COLOR = 'fill_color';
StyleTable.COLUMN_FILL_OPACITY = 'fill_opacity';
StyleTable.prototype.TABLE_TYPE = 'media';

module.exports = StyleTable;
