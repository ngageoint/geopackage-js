/**
 * UserMappingRow module.
 * @module extension/relatedTables
 */

var UserRow = require('../../user/userRow');

/**
 * User Mapping Row containing the values from a single result set row
 * @class
 * @extends UserRow
 * @param  {module:extension/relatedTables~UserMappingTable} table user mapping table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
class UserMappingRow extends UserRow {
  constructor(table, columnTypes, values) {
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

module.exports = UserMappingRow;
