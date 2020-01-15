/**
 * @memberOf module:extension/style
 * @class StyleDao
 */

import { StyleTable } from './styleTable';
import { AttributeDao } from '../../attributes/attributeDao';
import { StyleRow } from './styleRow';
import { GeoPackage } from '../../geoPackage';
import { DataTypes } from '../../..';
import { ColumnValues } from '../../dao/columnValues';

/**
 * Style DAO for reading style tables
 * @extends {AttributesDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
export class StyleDao extends AttributeDao<StyleRow> {
  constructor(geoPackage: GeoPackage, public table: StyleTable) {
    super(geoPackage, table);
  }
  /**
   * Creates a StyleRow object from the results
   * @param results
   * @returns {module:extension/style.StyleRow}
   */
  createObject(results: any): StyleRow {
    if (results) {
      return this.getRow(results) as StyleRow;
    }
    return this.newRow();
  }
  /**
   * Create a new style row
   * @return {module:extension/style.StyleRow}
   */
  newRow(): StyleRow {
    return new StyleRow(this.table);
  }
  /**
   * Create a style row with the column types and values
   * @param  {module:db/dataTypes[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/style.StyleRow}             icon row
   */
  newRowWithColumnTypes(columnTypes: { [key: string]: DataTypes }, values: ColumnValues[]): StyleRow {
    return new StyleRow(this.table, columnTypes, values);
  }
}
