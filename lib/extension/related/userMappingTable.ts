/**
 * userMappingTable module.
 * @module extension/relatedTables
 */
import { UserColumn } from '../../user/userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { UserCustomTable } from '../../user/custom/userCustomTable';
import { UserCustomColumn } from '../../user/custom/userCustomColumn';

/**
 * Contains user mapping table factory and utility methods
 * @class
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   user mapping columns
 */
export class UserMappingTable extends UserCustomTable {
  public static readonly COLUMN_BASE_ID: string = 'base_id';
  public static readonly COLUMN_RELATED_ID: string = 'related_id';

  /**
   * Get the base id column
   * @return {module:user/userColumn~UserColumn}
   */
  getBaseIdColumn(): UserColumn {
    return this.getColumn(UserMappingTable.COLUMN_BASE_ID);
  }
  /**
   * Get the related id column
   * @return {module:user/userColumn~UserColumn}
   */
  getRelatedIdColumn(): UserColumn {
    return this.getColumn(UserMappingTable.COLUMN_RELATED_ID);
  }
  /**
   * Creates a user mapping table with the minimum required columns followed by the additional columns
   * @param  {string} tableName name of the table
   * @param  {module:user/userColumn~UserColumn[]} [columns] additional columns
   * @return {module:extension/relatedTables~UserMappingTable}
   */
  static create(tableName: string, columns?: UserColumn[]): UserMappingTable {
    let allColumns = UserMappingTable.createRequiredColumns();
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
    return UserMappingTable.createRequiredColumns().length;
  }
  /**
   * Create the required columns
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createRequiredColumns(): UserColumn[] {
    return [
      UserMappingTable.createBaseIdColumn(),
      UserMappingTable.createRelatedIdColumn(),
    ];
  }
  /**
   * Create the required columns with starting column index
   * @param  {Number} [startingIndex=0] starting index of the required columns
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createRequiredColumnsWithIndex(startingIndex = 0): UserColumn[] {
    return [
      UserMappingTable.createBaseIdColumnWithIndex(startingIndex++),
      UserMappingTable.createRelatedIdColumnWithIndex(startingIndex),
    ];
  }
  /**
   * Create the base id column
   * @return {module:user/userColumn~UserColumn}
   */
  static createBaseIdColumn(): UserColumn {
    return UserCustomColumn.createColumn(UserMappingTable.COLUMN_BASE_ID, GeoPackageDataType.INTEGER, true);
  }
  /**
   * Create the base id column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createBaseIdColumnWithIndex(index: number): UserColumn {
    return UserCustomColumn.createColumnWithIndex(index, UserMappingTable.COLUMN_BASE_ID, GeoPackageDataType.INTEGER, true);
  }
  /**
   * Create the related id column
   * @return {module:user/userColumn~UserColumn}
   */
  static createRelatedIdColumn(): UserColumn {
    return UserCustomColumn.createColumn(UserMappingTable.COLUMN_RELATED_ID, GeoPackageDataType.INTEGER, true);
  }
  /**
   * Create the related id column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createRelatedIdColumnWithIndex(index?: number): UserColumn {
    return UserCustomColumn.createColumnWithIndex(index, UserMappingTable.COLUMN_RELATED_ID, GeoPackageDataType.INTEGER, true);
  }
  /**
   * Get the required columns
   * @return {string[]}
   */
  static requiredColumns(): string[] {
    return [UserMappingTable.COLUMN_BASE_ID, UserMappingTable.COLUMN_RELATED_ID];
  }
}
