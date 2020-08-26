/**
 * SimpleAttributesRow module.
 * @module extension/relatedTables
 */

import { UserRow } from '../../user/userRow';
import { SimpleAttributesTable } from './simpleAttributesTable';
import { DBValue } from '../../db/dbAdapter';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * User Simple Attributes Row containing the values from a single result set row
 * @class
 * @extends UserRow
 * @param  {module:extension/relatedTables~SimpleAttributesTable} simpleAttributesTable simple attributes table
 * @param  {module:db/geoPackageDataType[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export class SimpleAttributesRow extends UserRow {
  constructor(
    public simpleAttributesTable: SimpleAttributesTable,
    columnTypes?: { [key: string]: GeoPackageDataType },
    values?: Record<string, DBValue>,
  ) {
    super(simpleAttributesTable, columnTypes, values);
  }
}
