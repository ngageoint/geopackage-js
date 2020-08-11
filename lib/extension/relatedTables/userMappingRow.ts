import { UserMappingTable } from './userMappingTable';
import { UserRow } from '../../user/userRow';
import { DBValue } from '../../db/dbAdapter';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { UserColumn } from '../../user/userColumn';

/**
 * UserMappingRow module.
 * @module extension/relatedTables
 */

/**
 * User Mapping Row containing the values from a single result set row
 * @class
 * @extends UserRow
 * @param  {module:extension/relatedTables~UserMappingTable} table user mapping table
 * @param  {module:db/geoPackageDataType[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export class UserMappingRow extends UserRow {
  row: UserRow;
  constructor(
    public table: UserMappingTable,
    columnTypes?: { [key: string]: GeoPackageDataType },
    values?: Record<string, DBValue>,
  ) {
    super(table, columnTypes, values);
  }
  /**
   * Get the base id column
   * @return {module:user/userColumn~UserColumn}
   */
  get baseIdColumn(): UserColumn {
    return this.table.baseIdColumn;
  }
  /**
   * Gets the base id
   * @return {Number}
   */
  get baseId(): number {
    return this.getValueWithColumnName(this.baseIdColumn.name);
  }
  /**
   * Sets the base id
   * @param  {Number} baseId base id
   */
  set baseId(baseId: number) {
    this.setValueWithColumnName(this.baseIdColumn.name, baseId);
  }
  /**
   * Get the related id column
   * @return {module:user/userColumn~UserColumn}
   */
  get relatedIdColumn(): UserColumn {
    return this.table.relatedIdColumn;
  }
  /**
   * Gets the related id
   * @return {Number}
   */
  get relatedId(): number {
    return this.getValueWithColumnName(this.relatedIdColumn.name);
  }
  /**
   * Sets the related id
   * @param  {Number} relatedId related id
   */
  set relatedId(relatedId: number) {
    this.setValueWithColumnName(this.relatedIdColumn.name, relatedId);
  }
}
