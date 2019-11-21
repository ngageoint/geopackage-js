/**
 * @memberOf module:extension/style
 * @class StyleTable
 */

var AttributesTable = require('../../attributes/attributeTable')
  , UserColumn = require('../../user/userColumn')
  , UserCustomColumn = require('../../user/custom/userCustomColumn')
  , RelationType = require('../relatedTables/relationType')
  , DataTypes = require('../../db/dataTypes');

/**
 * Icon Requirements Class Media Table
 * @extends AttributesTable
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @constructor
 */
class StyleTable extends AttributesTable {
  constructor(tableName, columns) {
    super(tableName, columns);
    this.data_type = RelationType.ATTRIBUTES.dataType;
    this.relation_name = RelationType.ATTRIBUTES.name;
  }
  /**
   * Get the name column index
   * @return int
   */
  getNameColumnIndex() {
    return this.getColumnIndex(StyleTable.COLUMN_NAME);
  }
  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn() {
    return this.getColumnWithColumnName(StyleTable.COLUMN_NAME);
  }
  /**
   * Get the description column index
   * @return int
   */
  getDescriptionColumnIndex() {
    return this.getColumnIndex(StyleTable.COLUMN_DESCRIPTION);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  getDescriptionColumn() {
    return this.getColumnWithColumnName(StyleTable.COLUMN_DESCRIPTION);
  }
  /**
   * Get the color column index
   * @return int
   */
  getColorColumnIndex() {
    return this.getColumnIndex(StyleTable.COLUMN_COLOR);
  }
  /**
   * Get the color column
   * @return {module:user/userColumn~UserColumn}
   */
  getColorColumn() {
    return this.getColumnWithColumnName(StyleTable.COLUMN_COLOR);
  }
  /**
   * Get the opacity column index
   * @return int
   */
  getOpacityColumnIndex() {
    return this.getColumnIndex(StyleTable.COLUMN_OPACITY);
  }
  /**
   * Get the opacity column
   * @return {module:user/userColumn~UserColumn}
   */
  getOpacityColumn() {
    return this.getColumnWithColumnName(StyleTable.COLUMN_OPACITY);
  }
  /**
   * Get the width column index
   * @return int
   */
  getWidthColumnIndex() {
    return this.getColumnIndex(StyleTable.COLUMN_WIDTH);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn() {
    return this.getColumnWithColumnName(StyleTable.COLUMN_WIDTH);
  }
  /**
   * Get the fill_color column index
   * @return int
   */
  getFillColorColumnIndex() {
    return this.getColumnIndex(StyleTable.COLUMN_FILL_COLOR);
  }
  /**
   * Get the fill_color column
   * @return {module:user/userColumn~UserColumn}
   */
  getFillColorColumn() {
    return this.getColumnWithColumnName(StyleTable.COLUMN_FILL_COLOR);
  }
  /**
   * Get the fill_opacity column index
   * @return int
   */
  getFillOpacityColumnIndex() {
    return this.getColumnIndex(StyleTable.COLUMN_FILL_OPACITY);
  }
  /**
   * Get the fill_opacity column
   * @return {module:user/userColumn~UserColumn}
   */
  getFillOpacityColumn() {
    return this.getColumnWithColumnName(StyleTable.COLUMN_FILL_OPACITY);
  }
  /**
   * Create a media table with a minimum required columns followed by the additional columns
   * @return {module:extension/style.StyleTable}
   */
  static create() {
    return new StyleTable(StyleTable.TABLE_NAME, StyleTable.createColumns());
  }
  /**
   * Create the columns
   * @return {module:user/custom~UserCustomColumn[]}
   */
  static createColumns() {
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
  }
}

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
