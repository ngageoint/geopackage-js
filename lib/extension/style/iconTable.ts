/**
 * @memberOf module:extension/style
 * @class IconTable
 */

import MediaTable from '../relatedTables/mediaTable';
import UserCustomColumn from '../../user/custom/userCustomColumn';

var DataTypes = require('../../db/dataTypes');

/**
 * Icon Requirements Class Media Table
 * @class
 * @extends {MediaTable}
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @param {string[]} requiredColumns required column names
 */
export default class IconTable extends MediaTable {
  public static readonly TABLE_NAME = 'nga_icon';
  public static readonly COLUMN_NAME = 'name';
  public static readonly COLUMN_DESCRIPTION = 'description';
  public static readonly COLUMN_WIDTH = 'width';
  public static readonly COLUMN_HEIGHT = 'height';
  public static readonly COLUMN_ANCHOR_U = 'anchor_u';
  public static readonly COLUMN_ANCHOR_V = 'anchor_v';
  
  readonly TABLE_TYPE = 'media';

  constructor(tableName, columns, requiredColumns) {
    super(tableName, columns, requiredColumns);
  }
  /**
   * Get the name column index
   * @return int
   */
  getNameColumnIndex() {
    return this.getColumnIndex(IconTable.COLUMN_NAME);
  }
  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn() {
    return this.getColumnWithColumnName(IconTable.COLUMN_NAME);
  }
  /**
   * Get the description column index
   * @return int
   */
  getDescriptionColumnIndex() {
    return this.getColumnIndex(IconTable.COLUMN_DESCRIPTION);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  getDescriptionColumn() {
    return this.getColumnWithColumnName(IconTable.COLUMN_DESCRIPTION);
  }
  /**
   * Get the width column index
   * @return int
   */
  getWidthColumnIndex() {
    return this.getColumnIndex(IconTable.COLUMN_WIDTH);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn() {
    return this.getColumnWithColumnName(IconTable.COLUMN_WIDTH);
  }
  /**
   * Get the height column index
   * @return int
   */
  getHeightColumnIndex() {
    return this.getColumnIndex(IconTable.COLUMN_HEIGHT);
  }
  /**
   * Get the height column
   * @return {module:user/userColumn~UserColumn}
   */
  getHeightColumn() {
    return this.getColumnWithColumnName(IconTable.COLUMN_HEIGHT);
  }
  /**
   * Get the anchor_u column index
   * @return int
   */
  getAnchorUColumnIndex() {
    return this.getColumnIndex(IconTable.COLUMN_ANCHOR_U);
  }
  /**
   * Get the anchor_u column
   * @return {module:user/userColumn~UserColumn}
   */
  getAnchorUColumn() {
    return this.getColumnWithColumnName(IconTable.COLUMN_ANCHOR_U);
  }
  /**
   * Get the anchor_v column index
   * @return int
   */
  getAnchorVColumnIndex() {
    return this.getColumnIndex(IconTable.COLUMN_ANCHOR_V);
  }
  /**
   * Get the anchor_v column
   * @return {module:user/userColumn~UserColumn}
   */
  getAnchorVColumn() {
    return this.getColumnWithColumnName(IconTable.COLUMN_ANCHOR_V);
  }
  /**
   * Create a media table with a minimum required columns followed by the additional columns
   * @return {module:extension/relatedTables~MediaTable}
   */
  static create() {
    return new IconTable(IconTable.TABLE_NAME, IconTable.createColumns(), IconTable.requiredColumns());
  }
  static createRequiredColumns() {
    return MediaTable.createRequiredColumns();
  }
  /**
   * Get the required columns
   * @return {string[]}
   */
  static requiredColumns() {
    return MediaTable.requiredColumns();
  }
  /**
   * Create the columns
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createColumns() {
    var columns = IconTable.createRequiredColumns();
    var index = columns.length;
    columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_NAME, DataTypes.GPKGDataType.GPKG_DT_TEXT, undefined, false, undefined));
    columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_DESCRIPTION, DataTypes.GPKGDataType.GPKG_DT_TEXT, undefined, false, undefined));
    columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_WIDTH, DataTypes.GPKGDataType.GPKG_DT_REAL, undefined, false, undefined));
    columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_HEIGHT, DataTypes.GPKGDataType.GPKG_DT_REAL, undefined, false, undefined));
    columns.push(UserCustomColumn.createColumn(index++, IconTable.COLUMN_ANCHOR_U, DataTypes.GPKGDataType.GPKG_DT_REAL, undefined, false, undefined));
    columns.push(UserCustomColumn.createColumn(index, IconTable.COLUMN_ANCHOR_V, DataTypes.GPKGDataType.GPKG_DT_REAL, undefined, false, undefined));
    return columns;
  }
}
