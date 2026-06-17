import { MediaTable } from '../../related/media/mediaTable';
import { GeoPackageDataType } from '../../../db/geoPackageDataType';
import { UserColumn } from '../../../user/userColumn';
import { AttributesColumn } from '../../../attributes/attributesColumn';
import { UserCustomTable } from '../../../user/custom/userCustomTable';

/**
 * Icon Requirements Class Media Table
 */
export class IconTable extends MediaTable {
  public static readonly TABLE_NAME = 'nga_icon';
  public static readonly COLUMN_NAME = 'name';
  public static readonly COLUMN_DESCRIPTION = 'description';
  public static readonly COLUMN_WIDTH = 'width';
  public static readonly COLUMN_HEIGHT = 'height';
  public static readonly COLUMN_ANCHOR_U = 'anchor_u';
  public static readonly COLUMN_ANCHOR_V = 'anchor_v';

  /**
   * Constructor
   * @param table attributes table
   */
  public constructor(table?: UserCustomTable) {
    if (table != null) {
      super(table);
    } else {
      super(IconTable.TABLE_NAME, IconTable.createColumns());
    }
  }
  /**
   * Get the name column index
   * @return int
   */
  getNameColumnIndex(): number {
    return this.getColumnIndex(IconTable.COLUMN_NAME);
  }
  /**
   * Get the name column
   * @return {UserColumn}
   */
  getNameColumn(): UserColumn {
    return this.getColumn(IconTable.COLUMN_NAME);
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
   * @return {UserColumn}
   */
  getDescriptionColumn(): UserColumn {
    return this.getColumn(IconTable.COLUMN_DESCRIPTION);
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
   * @return {UserColumn}
   */
  getWidthColumn(): UserColumn {
    return this.getColumn(IconTable.COLUMN_WIDTH);
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
   * @return {UserColumn}
   */
  getHeightColumn(): UserColumn {
    return this.getColumn(IconTable.COLUMN_HEIGHT);
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
   * @return {UserColumn}
   */
  getAnchorUColumn(): UserColumn {
    return this.getColumn(IconTable.COLUMN_ANCHOR_U);
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
   * @return {UserColumn}
   */
  getAnchorVColumn(): UserColumn {
    return this.getColumn(IconTable.COLUMN_ANCHOR_V);
  }
  /**
   * Create a media table with a minimum required columns followed by the additional columns
   * @return {MediaTable}
   */
  static create(): IconTable {
    return new IconTable();
  }
  /**
   * Create the columns
   * @return {UserColumn[]}
   */
  static createColumns(): UserColumn[] {
    const columns = IconTable.createRequiredColumns();
    columns.push(AttributesColumn.createColumn(IconTable.COLUMN_NAME, GeoPackageDataType.TEXT, false));
    columns.push(AttributesColumn.createColumn(IconTable.COLUMN_DESCRIPTION, GeoPackageDataType.TEXT, false));
    columns.push(AttributesColumn.createColumn(IconTable.COLUMN_WIDTH, GeoPackageDataType.REAL, false));
    columns.push(AttributesColumn.createColumn(IconTable.COLUMN_HEIGHT, GeoPackageDataType.REAL, false));
    columns.push(AttributesColumn.createColumn(IconTable.COLUMN_ANCHOR_U, GeoPackageDataType.REAL, false));
    columns.push(AttributesColumn.createColumn(IconTable.COLUMN_ANCHOR_V, GeoPackageDataType.REAL, false));
    return columns;
  }
}
