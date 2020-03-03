import { AttributeTable } from './attributeTable';
import { UserRow } from '../user/userRow';
import { DBValue } from '../db/dbAdapter';
import { DataTypes } from '../db/dataTypes';

/**
 * Attribute Row containing the values from a single result set row
 * @class AttributeRow
 * @param  {module:attributes/attributeTable~AttributeTable} attributeTable attribute table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export class AttributeRow extends UserRow {
  constructor(
    attributeTable: AttributeTable,
    columnTypes?: { [key: string]: DataTypes },
    values?: Record<string, DBValue>,
  ) {
    super(attributeTable, columnTypes, values);
  }
}
