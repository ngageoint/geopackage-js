/**
 * SimpleAttributesDao module.
 * @module extension/relatedTables
 */
import { UserDao } from '../../user/userDao';
import { SimpleAttributesTable } from './simpleAttributesTable';
import { SimpleAttributesRow } from './simpleAttributesRow';
import { GeoPackage } from '../../geoPackage';
import { DataTypes } from '../../..';
import { DBValue } from '../../db/dbAdapter';

/**
 * User Simple Attributes DAO for reading user simple attributes data tables
 * @class
 * @extends UserDao
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
export class SimpleAttributesDao<T extends SimpleAttributesRow> extends UserDao<SimpleAttributesRow> {
  constructor(geoPackage: GeoPackage, public simpleAttributesTable: SimpleAttributesTable) {
    super(geoPackage, simpleAttributesTable);
  }
  /**
   * Create a new {module:extension/relatedTables~SimpleAttributesRow}
   * @return {module:extension/relatedTables~SimpleAttributesRow}
   */
  newRow(): SimpleAttributesRow {
    return new SimpleAttributesRow(this.simpleAttributesTable);
  }
  /**
   * Create a new {module:extension/relatedTables~SimpleAttributesRow} with the column types and values
   * @param  {module:db/dataTypes[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/relatedTables~SimpleAttributesRow}             simple attributes row
   */
  newRowWithColumnTypes(
    columnTypes: { [key: string]: DataTypes },
    values: Record<string, DBValue>,
  ): SimpleAttributesRow {
    return new SimpleAttributesRow(this.simpleAttributesTable, columnTypes, values);
  }
  /**
   * Gets the {module:extension/relatedTables~SimpleAttributesTable}
   * @return {module:extension/relatedTables~SimpleAttributesTable}
   */
  getTable(): SimpleAttributesTable {
    return this.simpleAttributesTable;
  }
  /**
   * Get the simple attributes rows from this table by ids
   * @param  {Number[]} ids array of ids
   * @return {module:extension/relatedTables~SimpleAttributesRow[]}
   */
  getRows(ids: number[]): SimpleAttributesRow[] {
    const simpleAttributesRows = [];
    for (let i = 0; i < ids.length; i++) {
      const row = this.queryForId(ids[i]);
      if (row) {
        simpleAttributesRows.push(row as SimpleAttributesRow);
      }
    }
    return simpleAttributesRows;
  }
}
