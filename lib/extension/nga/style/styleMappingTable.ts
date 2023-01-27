import { UserMappingTable } from '../../related/userMappingTable';
import { GeoPackageDataType } from '../../../db/geoPackageDataType';
import { UserColumn } from '../../../user/userColumn';
import { UserCustomColumn } from '../../../user/custom/userCustomColumn';

/**
 * Contains style mapping table factory and utility methods
 */
export class StyleMappingTable extends UserMappingTable {
  public static readonly COLUMN_GEOMETRY_TYPE_NAME = 'geometry_type_name';

  /**
   * Get the geometry type name column index
   * @return int
   */
  getGeometryTypeNameColumnIndex(): number {
    return this.getColumnIndex(StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME);
  }
  /**
   * Get the geometry type name column
   * @return {UserColumn}
   */
  getGeometryTypeNameColumn(): UserColumn {
    return this.getColumn(StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME);
  }
  /**
   * Creates a user mapping table with the minimum required columns followed by the additional columns
   * @param  {string} tableName name of the table
   * @return {UserMappingTable}
   */
  static create(tableName: string): StyleMappingTable {
    return new StyleMappingTable(tableName, StyleMappingTable.createColumns(), null);
  }
  /**
   * Create the columns
   * @return {UserColumn[]}
   */
  static createColumns(): UserCustomColumn[] {
    const columns = UserMappingTable.createRequiredColumns();
    columns.push(
      UserCustomColumn.createColumn(StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME, GeoPackageDataType.TEXT, false),
    );
    return columns;
  }
}
