/**
 * @memberOf module:extension/style
 * @class StyleDao
 */

import StyleTable from './styleTable';
import {AttributeDao} from '../../attributes/attributeDao';
import StyleRow from './styleRow';

/**
 * Style DAO for reading style tables
 * @extends {AttributesDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
export class StyleDao extends AttributeDao<StyleRow> {
  constructor(geoPackage, table) {
    super(geoPackage, table);
    this.table = table;
  }
  /**
   * Creates a StyleRow object from the results
   * @param results
   * @returns {module:extension/style.StyleRow}
   */
  createObject(results) {
    if (results) {
      return this.getRow(results);
    }
    return this.newRow();
  }
  /**
   * Create a new style row
   * @return {module:extension/style.StyleRow}
   */
  newRow() {
    return new StyleRow(this.table);
  }
  /**
   * Create a style row with the column types and values
   * @param  {module:db/dataTypes[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/style.StyleRow}             icon row
   */
  newRowWithColumnTypes(columnTypes, values) {
    return new StyleRow(this.table, columnTypes, values);
  }
}