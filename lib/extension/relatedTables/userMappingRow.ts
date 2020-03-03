import { UserMappingTable } from './userMappingTable';
import { UserRow } from '../../user/userRow';
import { DBValue } from '../../db/dbAdapter';
import { DataTypes } from '../../db/dataTypes';
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
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export class UserMappingRow extends UserRow {
  row: UserRow;
  constructor(
    public table: UserMappingTable,
    columnTypes?: { [key: string]: DataTypes },
    values?: Record<string, DBValue>,
  ) {
    super(table, columnTypes, values);
  }
  /**
   * Get the base id column
   * @return {module:user/userColumn~UserColumn}
   */
  getBaseIdColumn(): UserColumn {
    return this.table.getBaseIdColumn();
  }
  /**
   * Gets the base id
   * @return {Number}
   */
  getBaseId(): number {
    return this.getValueWithColumnName(this.getBaseIdColumn().name);
  }
  /**
   * Sets the base id
   * @param  {Number} baseId base id
   */
  setBaseId(baseId: number): void {
    this.setValueWithColumnName(this.getBaseIdColumn().name, baseId);
  }
  /**
   * Get the related id column
   * @return {module:user/userColumn~UserColumn}
   */
  getRelatedIdColumn(): UserColumn {
    return this.table.getRelatedIdColumn();
  }
  /**
   * Gets the related id
   * @return {Number}
   */
  getRelatedId(): number {
    return this.getValueWithColumnName(this.getRelatedIdColumn().name);
  }
  /**
   * Sets the related id
   * @param  {Number} relatedId related id
   */
  setRelatedId(relatedId: number): void {
    this.setValueWithColumnName(this.getRelatedIdColumn().name, relatedId);
  }
}
