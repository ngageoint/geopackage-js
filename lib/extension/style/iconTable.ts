/**
 * @memberOf module:extension/style
 * @class IconTable
 */

import { MediaTable } from '../relatedTables/mediaTable';
import { UserCustomColumn } from '../../user/custom/userCustomColumn';

import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { UserColumn } from '../../user/userColumn';

/**
 * Icon Requirements Class Media Table
 * @class
 * @extends {MediaTable}
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @param {string[]} requiredColumns required column names
 */
export class IconTable extends MediaTable {
  public static readonly TABLE_NAME = 'nga_icon';
  public static readonly COLUMN_NAME = 'name';
  public static readonly COLUMN_DESCRIPTION = 'description';
  public static readonly COLUMN_WIDTH = 'width';
  public static readonly COLUMN_HEIGHT = 'height';
  public static readonly COLUMN_ANCHOR_U = 'anchor_u';
  public static readonly COLUMN_ANCHOR_V = 'anchor_v';

  readonly TABLE_TYPE = 'media';

  /**
   * Get the name column index
   * @return int
   */
  getNameColumnIndex(): number {
    return this.getColumnIndex(IconTable.COLUMN_NAME);
  }
  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn(): UserColumn {
    return this.getColumnWithColumnName(IconTable.COLUMN_NAME);
  }
  /**
   * Get the description column index
   * @return int
   */
  getDescriptionColumnIndex(): number {
    return this.getColumnIndex(IconTable.COLUMN_DESCRIPTION);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  getDescriptionColumn(): UserColumn {
    return this.getColumnWithColumnName(IconTable.COLUMN_DESCRIPTION);
  }
  /**
   * Get the width column index
   * @return int
   */
  getWidthColumnIndex(): number {
    return this.getColumnIndex(IconTable.COLUMN_WIDTH);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn(): UserColumn {
    return this.getColumnWithColumnName(IconTable.COLUMN_WIDTH);
  }
  /**
   * Get the height column index
   * @return int
   */
  getHeightColumnIndex(): number {
    return this.getColumnIndex(IconTable.COLUMN_HEIGHT);
  }
  /**
   * Get the height column
   * @return {module:user/userColumn~UserColumn}
   */
  getHeightColumn(): UserColumn {
    return this.getColumnWithColumnName(IconTable.COLUMN_HEIGHT);
  }
  /**
   * Get the anchor_u column index
   * @return int
   */
  getAnchorUColumnIndex(): number {
    return this.getColumnIndex(IconTable.COLUMN_ANCHOR_U);
  }
  /**
   * Get the anchor_u column
   * @return {module:user/userColumn~UserColumn}
   */
  getAnchorUColumn(): UserColumn {
    return this.getColumnWithColumnName(IconTable.COLUMN_ANCHOR_U);
  }
  /**
   * Get the anchor_v column index
   * @return int
   */
  getAnchorVColumnIndex(): number {
    return this.getColumnIndex(IconTable.COLUMN_ANCHOR_V);
  }
  /**
   * Get the anchor_v column
   * @return {module:user/userColumn~UserColumn}
   */
  getAnchorVColumn(): UserColumn {
    return this.getColumnWithColumnName(IconTable.COLUMN_ANCHOR_V);
  }
  /**
   * Create a media table with a minimum required columns followed by the additional columns
   * @return {module:extension/relatedTables~MediaTable}
   */
  static create(): IconTable {
    return new IconTable(IconTable.TABLE_NAME, IconTable.createColumns(), IconTable.requiredColumns());
  }
  static createRequiredColumns(): UserColumn[] {
    return MediaTable.createRequiredColumns();
  }
  /**
   * Get the required columns
   * @return {string[]}
   */
  static requiredColumns(): string[] {
    return MediaTable.requiredColumns();
  }
  /**
   * Create the columns
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createColumns(): UserColumn[] {
    const columns = IconTable.createRequiredColumns();
    let index = columns.length;
    columns.push(
      UserColumn.createColumn(index++, IconTable.COLUMN_NAME, GeoPackageDataType.TEXT, false),
    );
    columns.push(
      UserColumn.createColumn(index++, IconTable.COLUMN_DESCRIPTION, GeoPackageDataType.TEXT, false),
    );
    columns.push(
      UserColumn.createColumn(index++, IconTable.COLUMN_WIDTH, GeoPackageDataType.REAL, false),
    );
    columns.push(
      UserColumn.createColumn(index++, IconTable.COLUMN_HEIGHT, GeoPackageDataType.REAL, false),
    );
    columns.push(
      UserColumn.createColumn(index++, IconTable.COLUMN_ANCHOR_U, GeoPackageDataType.REAL, false),
    );
    columns.push(
      UserColumn.createColumn(index, IconTable.COLUMN_ANCHOR_V, GeoPackageDataType.REAL, false),
    );
    return columns;
  }
}
