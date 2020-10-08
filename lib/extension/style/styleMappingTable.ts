/**
 * @memberOf module:extension/style
 * @class StyleMappingTable
 */

import { UserMappingTable } from '../relatedTables/userMappingTable';
import { UserCustomColumn } from '../../user/custom/userCustomColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { UserColumn } from '../../user/userColumn';

/**
 * Contains style mapping table factory and utility methods
 * @extends UserMappingTable
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   style mapping columns
 * @constructor
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
   * @return {module:user/userColumn~UserColumn}
   */
  getGeometryTypeNameColumn(): UserColumn {
    return this.getColumnWithColumnName(StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME);
  }
  /**
   * Creates a user mapping table with the minimum required columns followed by the additional columns
   * @param  {string} tableName name of the table
   * @return {module:extension/relatedTables~UserMappingTable}
   */
  static create(tableName: string): StyleMappingTable {
    return new StyleMappingTable(tableName, StyleMappingTable.createColumns(), null);
  }
  /**
   * Create the columns
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createColumns(): UserColumn[] {
    const columns = UserMappingTable.createRequiredColumns();
    const index = columns.length;
    columns.push(UserColumn.createColumn(index, StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME, GeoPackageDataType.TEXT, false));
    return columns;
  }
}
