/**
 * SimpleAttributesRow module.
 * @module extension/relatedTables
 */

import UserRow from '../../user/userRow';
import SimpleAttributesTable from './simpleAttributesTable';

/**
 * User Simple Attributes Row containing the values from a single result set row
 * @class
 * @extends UserRow
 * @param  {module:extension/relatedTables~SimpleAttributesTable} simpleAttributesTable simple attributes table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export default class SimpleAttributesRow extends UserRow {
  simpleAttributesTable: SimpleAttributesTable;
  constructor(simpleAttributesTable: SimpleAttributesTable, columnTypes?: any[], values?: any[]) {
    super(simpleAttributesTable, columnTypes, values);
    this.simpleAttributesTable = simpleAttributesTable;
  }
  /**
   * Gets the primary key id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn() {
    return this.simpleAttributesTable.getIdColumn();
  }
  /**
   * Gets the id
   * @return {Number}
   */
  getId() {
    return this.getValueWithColumnName(this.getIdColumn().name);
  }
}
