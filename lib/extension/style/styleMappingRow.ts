/**
 * @memberOf module:extension/style
 * @class StyleMappingRow
 */

import { UserMappingRow } from '../relatedTables/userMappingRow';
import { StyleMappingTable } from './styleMappingTable';
import { UserColumn } from '../../user/userColumn';
import { DataTypes } from '../../..';
import { DBValue } from '../../db/dbAdapter';

/**
 * User Mapping Row containing the values from a single result set row
 * @extends UserMappingRow
 * @param  {module:extension/style.StyleMappingTable} styleMappingTable style mapping table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
export class StyleMappingRow extends UserMappingRow {
  styleMappingTable: StyleMappingTable;
  constructor(
    styleMappingTable: StyleMappingTable,
    columnTypes?: { [key: string]: DataTypes },
    values?: Record<string, DBValue>,
  ) {
    super(styleMappingTable, columnTypes, values);
    this.styleMappingTable = styleMappingTable;
  }
  /**
   * Get the geometry type name column
   * @return {module:user/userColumn~UserColumn}
   */
  getGeometryTypeNameColumn(): UserColumn {
    return this.styleMappingTable.getGeometryTypeNameColumn();
  }
  /**
   * Gets the geometry type name
   * @return {string}
   */
  getGeometryTypeName(): string {
    return this.getValueWithColumnName(this.getGeometryTypeNameColumn().name);
  }
  /**
   * Sets the geometry type name
   * @param  {string} geometryTypeName geometry type name
   */
  setGeometryTypeName(geometryTypeName: string): void {
    this.setValueWithColumnName(this.getGeometryTypeNameColumn().name, geometryTypeName);
  }
}
