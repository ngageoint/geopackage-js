/**
 * @module attributes/attributesDao
 */
import { UserDao } from '../user/userDao';
import { GeoPackage } from '../geoPackage';
import { AttributesTable } from './attributesTable';
import { AttributesRow } from './attributesRow';
import { Contents } from '../core/contents/contents';
import { DBValue } from '../db/dbAdapter';
import { GeoPackageDataType } from '../db/geoPackageDataType';
import {AttributesTableReader} from "./attributesTableReader";
/**
 * Attribute DAO for reading attribute user data tables
 * @class AttributesDao
 * @extends UserDao
 * @param  {module:geoPackage~GeoPackage} geoPackage              geopackage object
 * @param  {module:attributes/attributesTable~AttributeTable} table           attribute table
 */
export class AttributesDao<T extends AttributesRow> extends UserDao<AttributesRow> {
  /**
   * Contents of this AttributeDao
   * @member {module:core/contents~Contents}
   */
  contents: Contents;

  constructor(geoPackage: GeoPackage, table: AttributesTable) {
    super(geoPackage, table);
    if (!table.contents) {
      throw new Error('Attributes table has null Contents');
    }

    this.contents = table.contents;
  }

  get table(): AttributesTable {
    return this._table as AttributesTable;
  }

  /**
   * Create a new attribute row with the column types and values
   * @param  {Array} columnTypes column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:attributes/attributesRow~AttributeRow}             attribute row
   */
  newRow(columnTypes?: { [key: string]: GeoPackageDataType }, values?: Record<string, DBValue>): AttributesRow {
    return new AttributesRow(this.table, columnTypes, values);
  }

  static readTable(geoPackage: GeoPackage, tableName: string): AttributesDao<AttributesRow> {
    return geoPackage.getAttributeDao(tableName);
  }
}
