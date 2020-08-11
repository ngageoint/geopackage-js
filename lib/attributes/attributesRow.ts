import { AttributesTable } from './attributesTable';
import { UserRow } from '../user/userRow';
import { DBValue } from '../db/dbAdapter';
import { GeoPackageDataType } from '../db/geoPackageDataType';

/**
 * Attribute Row containing the values from a single result set row
 * @class AttributesRow
 * @param  {module:attributes/attributesTable~AttributeTable} attributeTable attribute table
 * @param  {module:db/geoPackageDataType[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export class AttributesRow extends UserRow {
  constructor(
    attributeTable: AttributesTable,
    columnTypes?: { [key: string]: GeoPackageDataType },
    values?: Record<string, DBValue>,
  ) {
    super(attributeTable, columnTypes, values);
  }
}
