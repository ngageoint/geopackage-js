/**
 * @memberOf module:extension/style
 * @class StyleDao
 */

import { StyleTable } from './styleTable';
import { AttributesDao } from '../../attributes/attributesDao';
import { StyleRow } from './styleRow';
import { GeoPackage } from '../../geoPackage';
import { DBValue } from '../../db/dbAdapter';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * Style DAO for reading style tables
 * @extends {AttributesDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
export class StyleDao extends AttributesDao<StyleRow> {
  constructor(geoPackage: GeoPackage, table: StyleTable) {
    super(geoPackage, table);
  }
  /**
   * Creates a StyleRow object from the results
   * @param results
   * @returns {module:extension/style.StyleRow}
   */
  createObject(results: Record<string, DBValue>): StyleRow {
    if (results) {
      return this.getRow(results) as StyleRow;
    }
    return this.newRow();
  }

  get table(): StyleTable {
    return this._table as StyleTable;
  }
  /**
   * Create a style row with the column types and values
   * @param  {module:db/geoPackageDataType[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/style.StyleRow}             icon row
   */
  newRow(columnTypes?: { [key: string]: GeoPackageDataType }, values?: Record<string, DBValue>): StyleRow {
    return new StyleRow(this.table, columnTypes, values);
  }
}
