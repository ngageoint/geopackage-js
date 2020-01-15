/**
 * userTableReader module.
 * @module user/userTableReader
 */
import { UserTable } from './userTable';
import { GeoPackageConnection } from '../..';
import { UserColumn } from './userColumn';
import { DataTypes } from '../db/dataTypes';

/**
 * @class
 */
export class UserTableReader {
  private static readonly GPKG_UTR_CID: string = 'cid';
  private static readonly GPKG_UTR_NAME: string = 'name';
  private static readonly GPKG_UTR_TYPE: string = 'type';
  private static readonly GPKG_UTR_NOT_NULL: string = 'notnull';
  private static readonly GPKG_UTR_PK: string = 'pk';
  private static readonly GPKG_UTR_DFLT_VALUE: string = 'dflt_value';
  /**
   * @param tableName name of the table
   * @param requiredColumns array of the required column nammes
   */
  constructor(public table_name: string, public requiredColumns?: string[]) {}
  /**
   * Read the table
   * @param  {object} db db connection
   * @return {module:user/userTable~UserTable}
   */
  readTable(db: GeoPackageConnection): UserTable {
    const columnList = [];
    const results = db.all("PRAGMA table_info('" + this.table_name + "')");
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const index = result[UserTableReader.GPKG_UTR_CID];
      const name = result[UserTableReader.GPKG_UTR_NAME];
      let type = result[UserTableReader.GPKG_UTR_TYPE];
      const notNull = result[UserTableReader.GPKG_UTR_NOT_NULL] === 1;
      const primarykey = result[UserTableReader.GPKG_UTR_PK] === 1;
      let max = undefined;
      if (type && type.lastIndexOf(')') === type.length - 1) {
        const maxStart = type.indexOf('(');
        if (maxStart > -1) {
          const maxString = type.substring(maxStart + 1, type.length - 1);
          if (maxString !== '') {
            max = parseInt(maxString);
            type = type.substring(0, maxStart);
          }
        }
      }
      let defaultValue = undefined;
      if (result[UserTableReader.GPKG_UTR_DFLT_VALUE]) {
        defaultValue = result[UserTableReader.GPKG_UTR_DFLT_VALUE].replace(/\\'/g, '');
      }
      const column = this.createColumnWithResults(result, index, name, type, max, notNull, defaultValue, primarykey);
      columnList.push(column);
    }
    if (columnList.length === 0) {
      throw new Error('Table does not exist: ' + this.table_name);
    }
    return this.createTable(this.table_name, columnList, this.requiredColumns);
  }
  /**
   * Creates a user column
   * @param {Object} result
   * @param {Number} index        column index
   * @param {string} name         column name
   * @param {module:db/dataTypes~GPKGDataType} type         data type
   * @param {Number} max max value
   * @param {Boolean} notNull      not null
   * @param {Object} defaultValue default value or nil
   * @param {Boolean} primaryKey primary key
   * @return {module:user/custom~UserCustomColumn}
   */
  createColumnWithResults(
    result: any,
    index: number,
    name: string,
    type: string,
    max?: number,
    notNull?: boolean,
    defaultValue?: any,
    primaryKey?: boolean,
  ): UserColumn {
    const dataType = DataTypes.fromName(type);
    return new UserColumn(index, name, dataType, max, notNull, defaultValue, primaryKey);
  }
  /**
   * Create the table
   * @param  {string} tableName table name
   * @param  {module:dao/columnValues~ColumnValues[]} columns   columns
   * @param  {string[]} [requiredColumns] required columns
   * @return {module:user/userTable~UserTable}           the user table
   *
   */
  createTable(tableName: string, columns: UserColumn[], requiredColumns?: string[]): UserTable {
    return new UserTable(tableName, columns, requiredColumns);
  }
}
