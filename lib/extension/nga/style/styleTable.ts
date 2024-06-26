import { AttributesTable } from '../../../attributes/attributesTable';
import { RelationType } from '../../related/relationType';
import { UserColumn } from '../../../user/userColumn';
import { GeoPackageDataType } from '../../../db/geoPackageDataType';
import { AttributesColumn } from '../../../attributes/attributesColumn';

/**
 * StyleTable
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
  data_type: string = RelationType.ATTRIBUTES.dataType;
  relation_name: string = RelationType.ATTRIBUTES.name;

  /**
   * Constructor
   * @param attributesTable attributes table
   */
  public constructor(attributesTable?: AttributesTable) {
    super(StyleTable.TABLE_NAME, StyleTable.createColumns());
    if (attributesTable != null) {
      this.setContents(attributesTable.getContents());
    }
  }

  /**
   * Get the name column index
   * @return int
   */
  getNameColumnIndex(): number {
    return this.getColumnIndex(StyleTable.COLUMN_NAME);
  }
  /**
   * Get the name column
   * @return {UserColumn}
   */
  getNameColumn(): UserColumn {
    return this.getColumn(StyleTable.COLUMN_NAME);
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
   * @return {UserColumn}
   */
  getDescriptionColumn(): UserColumn {
    return this.getColumn(StyleTable.COLUMN_DESCRIPTION);
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
   * @return {UserColumn}
   */
  getColorColumn(): UserColumn {
    return this.getColumn(StyleTable.COLUMN_COLOR);
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
   * @return {UserColumn}
   */
  getOpacityColumn(): UserColumn {
    return this.getColumn(StyleTable.COLUMN_OPACITY);
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
   * @return {UserColumn}
   */
  getWidthColumn(): UserColumn {
    return this.getColumn(StyleTable.COLUMN_WIDTH);
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
   * @return {UserColumn}
   */
  getFillColorColumn(): UserColumn {
    return this.getColumn(StyleTable.COLUMN_FILL_COLOR);
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
   * @return {UserColumn}
   */
  getFillOpacityColumn(): UserColumn {
    return this.getColumn(StyleTable.COLUMN_FILL_OPACITY);
  }
  /**
   * Create a media table with a minimum required columns followed by the additional columns
   * @return {StyleTable}
   */
  static create(): StyleTable {
    return new StyleTable();
  }
  /**
   * Create the columns
   * @return {UserCustomColumn[]}
   */
  static createColumns(): AttributesColumn[] {
    const columns = [];
    columns.push(AttributesColumn.createPrimaryKeyColumn(StyleTable.COLUMN_ID));
    columns.push(AttributesColumn.createColumn(StyleTable.COLUMN_NAME, GeoPackageDataType.TEXT, false));
    columns.push(AttributesColumn.createColumn(StyleTable.COLUMN_DESCRIPTION, GeoPackageDataType.TEXT, false));
    columns.push(AttributesColumn.createColumn(StyleTable.COLUMN_COLOR, GeoPackageDataType.TEXT, false));
    columns.push(AttributesColumn.createColumn(StyleTable.COLUMN_OPACITY, GeoPackageDataType.REAL, false));
    columns.push(AttributesColumn.createColumn(StyleTable.COLUMN_WIDTH, GeoPackageDataType.REAL, false));
    columns.push(AttributesColumn.createColumn(StyleTable.COLUMN_FILL_COLOR, GeoPackageDataType.TEXT, false));
    columns.push(AttributesColumn.createColumn(StyleTable.COLUMN_FILL_OPACITY, GeoPackageDataType.REAL, false));
    return columns;
  }
}
