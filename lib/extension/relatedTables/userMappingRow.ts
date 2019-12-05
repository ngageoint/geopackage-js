import UserMappingTable from "./userMappingTable";
import UserRow from '../../user/userRow';

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
export default class UserMappingRow extends UserRow {
  table: UserMappingTable;

  constructor(table: UserMappingTable, columnTypes?: any[], values?: any[]) {
    super(table, columnTypes, values);
    this.table = table;
  }
  /**
   * Get the base id column
   * @return {module:user/userColumn~UserColumn}
   */
  getBaseIdColumn() {
    return this.table.getBaseIdColumn();
  }
  /**
   * Gets the base id
   * @return {Number}
   */
  getBaseId() {
    return this.getValueWithColumnName(this.getBaseIdColumn().name);
  }
  /**
   * Sets the base id
   * @param  {Number} baseId base id
   */
  setBaseId(baseId) {
    this.setValueWithColumnName(this.getBaseIdColumn().name, baseId);
  }
  /**
   * Get the related id column
   * @return {module:user/userColumn~UserColumn}
   */
  getRelatedIdColumn() {
    return this.table.getRelatedIdColumn();
  }
  /**
   * Gets the related id
   * @return {Number}
   */
  getRelatedId() {
    return this.getValueWithColumnName(this.getRelatedIdColumn().name);
  }
  /**
   * Sets the related id
   * @param  {Number} relatedId related id
   */
  setRelatedId(relatedId) {
    this.setValueWithColumnName(this.getRelatedIdColumn().name, relatedId);
  }
}
