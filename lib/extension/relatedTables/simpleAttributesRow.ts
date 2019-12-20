/**
 * SimpleAttributesRow module.
 * @module extension/relatedTables
 */

import UserRow from '../../user/userRow';
import SimpleAttributesTable from './simpleAttributesTable';
import { DataTypes, UserColumn } from '../../..';
import ColumnValues from '../../dao/columnValues';

/**
 * User Simple Attributes Row containing the values from a single result set row
 * @class
 * @extends UserRow
 * @param  {module:extension/relatedTables~SimpleAttributesTable} simpleAttributesTable simple attributes table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export default class SimpleAttributesRow extends UserRow {
  constructor(public simpleAttributesTable: SimpleAttributesTable, columnTypes?: DataTypes[], values?: ColumnValues[]) {
    super(simpleAttributesTable, columnTypes, values);
  }
  /**
   * Gets the primary key id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn(): UserColumn {
    return this.simpleAttributesTable.getIdColumn();
  }
  /**
   * Gets the id
   * @return {Number}
   */
  getId(): number {
    return this.getValueWithColumnName(this.getIdColumn().name);
  }
}
