/**
 * @memberOf module:extension/style
 * @class StyleTable
 */
import { AttributesTable } from '../../attributes/attributesTable';
import { RelationType } from '../relatedTables/relationType';
import { UserColumn } from '../../user/userColumn';
import { UserCustomColumn } from '../../user/custom/userCustomColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * Icon Requirements Class Media Table
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @constructor
 */
export class StyleTable extends AttributesTable {
  public static readonly TABLE_NAME: string = 'nga_style';
  public static readonly COLUMN_ID: string = 'id';
  public static readonly COLUMN_NAME: string = 'name';
  public static readonly COLUMN_DESCRIPTION: string = 'description';
  public static readonly COLUMN_COLOR: string = 'color';
  public static readonly COLUMN_OPACITY: string = 'opacity';
  public static readonly COLUMN_WIDTH: string = 'width';
  public static readonly COLUMN_FILL_COLOR: string = 'fill_color';
  public static readonly COLUMN_FILL_OPACITY: string = 'fill_opacity';
  readonly TABLE_TYPE: string = 'media';
  data_type: string = RelationType.ATTRIBUTES.dataType;
  relation_name: string = RelationType.ATTRIBUTES.name;

  /**
   * Get the name column index
   * @return int
   */
  getNameColumnIndex(): number {
    return this.getColumnIndex(StyleTable.COLUMN_NAME);
  }
  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn(): UserColumn {
    return this.getColumnWithColumnName(StyleTable.COLUMN_NAME);
  }
  /**
   * Get the description column index
   * @return int
   */
  getDescriptionColumnIndex(): number {
    return this.getColumnIndex(StyleTable.COLUMN_DESCRIPTION);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  getDescriptionColumn(): UserColumn {
    return this.getColumnWithColumnName(StyleTable.COLUMN_DESCRIPTION);
  }
  /**
   * Get the color column index
   * @return int
   */
  getColorColumnIndex(): number {
    return this.getColumnIndex(StyleTable.COLUMN_COLOR);
  }
  /**
   * Get the color column
   * @return {module:user/userColumn~UserColumn}
   */
  getColorColumn(): UserColumn {
    return this.getColumnWithColumnName(StyleTable.COLUMN_COLOR);
  }
  /**
   * Get the opacity column index
   * @return int
   */
  getOpacityColumnIndex(): number {
    return this.getColumnIndex(StyleTable.COLUMN_OPACITY);
  }
  /**
   * Get the opacity column
   * @return {module:user/userColumn~UserColumn}
   */
  getOpacityColumn(): UserColumn {
    return this.getColumnWithColumnName(StyleTable.COLUMN_OPACITY);
  }
  /**
   * Get the width column index
   * @return int
   */
  getWidthColumnIndex(): number {
    return this.getColumnIndex(StyleTable.COLUMN_WIDTH);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn(): UserColumn {
    return this.getColumnWithColumnName(StyleTable.COLUMN_WIDTH);
  }
  /**
   * Get the fill_color column index
   * @return int
   */
  getFillColorColumnIndex(): number {
    return this.getColumnIndex(StyleTable.COLUMN_FILL_COLOR);
  }
  /**
   * Get the fill_color column
   * @return {module:user/userColumn~UserColumn}
   */
  getFillColorColumn(): UserColumn {
    return this.getColumnWithColumnName(StyleTable.COLUMN_FILL_COLOR);
  }
  /**
   * Get the fill_opacity column index
   * @return int
   */
  getFillOpacityColumnIndex(): number {
    return this.getColumnIndex(StyleTable.COLUMN_FILL_OPACITY);
  }
  /**
   * Get the fill_opacity column
   * @return {module:user/userColumn~UserColumn}
   */
  getFillOpacityColumn(): UserColumn {
    return this.getColumnWithColumnName(StyleTable.COLUMN_FILL_OPACITY);
  }
  /**
   * Create a media table with a minimum required columns followed by the additional columns
   * @return {module:extension/style.StyleTable}
   */
  static create(): StyleTable {
    return new StyleTable(StyleTable.TABLE_NAME, StyleTable.createColumns());
  }
  /**
   * Create the columns
   * @return {module:user/custom~UserCustomColumn[]}
   */
  static createColumns(): UserCustomColumn[] {
    const columns = [];
    let index = 0;
    columns.push(UserColumn.createPrimaryKeyColumnWithIndexAndName(index++, StyleTable.COLUMN_ID));
    columns.push(
      UserCustomColumn.createColumn(index++, StyleTable.COLUMN_NAME, GeoPackageDataType.TEXT, undefined, false, undefined),
    );
    columns.push(
      UserCustomColumn.createColumn(
        index++,
        StyleTable.COLUMN_DESCRIPTION,
        GeoPackageDataType.TEXT,
        undefined,
        false,
        undefined,
      ),
    );
    columns.push(
      UserCustomColumn.createColumn(index++, StyleTable.COLUMN_COLOR, GeoPackageDataType.TEXT, undefined, false, undefined),
    );
    columns.push(
      UserCustomColumn.createColumn(index++, StyleTable.COLUMN_OPACITY, GeoPackageDataType.REAL, undefined, false, undefined),
    );
    columns.push(
      UserCustomColumn.createColumn(index++, StyleTable.COLUMN_WIDTH, GeoPackageDataType.REAL, undefined, false, undefined),
    );
    columns.push(
      UserCustomColumn.createColumn(index++, StyleTable.COLUMN_FILL_COLOR, GeoPackageDataType.TEXT, undefined, false, undefined),
    );
    columns.push(
      UserCustomColumn.createColumn(index, StyleTable.COLUMN_FILL_OPACITY, GeoPackageDataType.REAL, undefined, false, undefined),
    );
    return columns;
  }
}
