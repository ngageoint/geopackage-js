/**
 * @memberOf module:extension/style
 * @class StyleTable
 */
import {AttributeTable} from '../../attributes/attributeTable'
import {RelationType} from '../relatedTables/relationType';
import {UserColumn} from '../../user/userColumn'
import {UserCustomColumn} from '../../user/custom/userCustomColumn';
import {DataTypes} from '../../db/dataTypes'

/**
 * Icon Requirements Class Media Table
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @constructor
 */
export class StyleTable extends AttributeTable {
  public static readonly TABLE_NAME = 'nga_style';
  public static readonly COLUMN_ID = 'id';
  public static readonly COLUMN_NAME = 'name';
  public static readonly COLUMN_DESCRIPTION = 'description';
  public static readonly COLUMN_COLOR = 'color';
  public static readonly COLUMN_OPACITY = 'opacity';
  public static readonly COLUMN_WIDTH = 'width';
  public static readonly COLUMN_FILL_COLOR = 'fill_color';
  public static readonly COLUMN_FILL_OPACITY = 'fill_opacity';
  readonly TABLE_TYPE = 'media';
  data_type: string;
  relation_name: string;

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
    columns.push(UserCustomColumn.createColumn(index, StyleTable.COLUMN_FILL_OPACITY, DataTypes.GPKGDataType.GPKG_DT_REAL, undefined, false, undefined));
    return columns;
  }
}
