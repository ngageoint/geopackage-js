/**
 * userMappingTable module.
 * @module extension/relatedTables
 */
import { UserColumn } from '../../user/userColumn';
import { UserCustomColumn } from '../../user/custom/userCustomColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { UserCustomTable } from '../../user/custom/userCustomTable';

/**
 * Contains user mapping table factory and utility methods
 * @class
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   user mapping columns
 */
export class UserMappingTable extends UserCustomTable {
  public static readonly COLUMN_BASE_ID: string = 'base_id';
  public static readonly COLUMN_RELATED_ID: string = 'related_id';

  get tableType(): string {
    return 'userMappingTable';
  }
  /**
   * Get the base id column
   * @return {module:user/userColumn~UserColumn}
   */
  get baseIdColumn(): UserColumn {
    return this.getColumnWithColumnName(UserMappingTable.COLUMN_BASE_ID);
  }
  /**
   * Get the related id column
   * @return {module:user/userColumn~UserColumn}
   */
  get relatedIdColumn(): UserColumn {
    return this.getColumnWithColumnName(UserMappingTable.COLUMN_RELATED_ID);
  }
  /**
   * Creates a user mapping table with the minimum required columns followed by the additional columns
   * @param  {string} tableName name of the table
   * @param  {module:user/userColumn~UserColumn[]} [columns] additional columns
   * @return {module:extension/relatedTables~UserMappingTable}
   */
  static create(tableName: string, columns?: UserColumn[]): UserMappingTable {
    let allColumns = UserMappingTable.createRequiredColumns(0);
    if (columns) {
      allColumns = allColumns.concat(columns);
    }
    return new UserMappingTable(tableName, allColumns, UserMappingTable.requiredColumns());
  }
  /**
   * Get the number of required columns
   * @return {Number}
   */
  static numRequiredColumns(): number {
    return UserMappingTable.createRequiredColumns(0).length;
  }
  /**
   * Create the required columns
   * @param  {Number} [startingIndex=0] starting index of the required columns
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createRequiredColumns(startingIndex = 0): UserColumn[] {
    return [
      UserMappingTable.createBaseIdColumn(startingIndex++),
      UserMappingTable.createRelatedIdColumn(startingIndex),
    ];
  }
  /**
   * Create the base id column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createBaseIdColumn(index: number): UserColumn {
    return UserCustomColumn.createColumn(index, UserMappingTable.COLUMN_BASE_ID, GeoPackageDataType.INTEGER, true);
  }
  /**
   * Create the related id column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createRelatedIdColumn(index: number): UserColumn {
    return UserCustomColumn.createColumn(index, UserMappingTable.COLUMN_RELATED_ID, GeoPackageDataType.INTEGER, true);
  }
  /**
   * Get the required columns
   * @return {string[]}
   */
  static requiredColumns(): string[] {
    return [UserMappingTable.COLUMN_BASE_ID, UserMappingTable.COLUMN_RELATED_ID];
  }
}
