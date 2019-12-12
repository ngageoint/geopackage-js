/**
 * userTableReader module.
 * @module user/userTableReader
 */
import UserTable from './userTable';
import { GeoPackageConnection } from '../..';
import UserColumn from './userColumn';

import DataTypes from '../db/dataTypes';

/**
 * @class
 */
export default class UserTableReader {
  private static readonly GPKG_UTR_CID = "cid";
  private static readonly GPKG_UTR_NAME = "name";
  private static readonly GPKG_UTR_TYPE = "type";
  private static readonly GPKG_UTR_NOT_NULL = "notnull";
  private static readonly GPKG_UTR_PK = "pk";
  private static readonly GPKG_UTR_DFLT_VALUE = "dflt_value";

  table_name: string;
  requiredColumns: any;
  /**
   * 
   * @param {string} tableName name of the table
   * @param {string[]} [requiredColumns] array of the required column nammes
   */
  constructor(tableName: string, requiredColumns?: string[]) {
    // eslint-disable-next-line camelcase
    this.table_name = tableName;
    this.requiredColumns = requiredColumns;
  }
  /**
   * Read the table
   * @param  {object} db db connection
   * @return {module:user/userTable~UserTable}
   */
  readTable(db: GeoPackageConnection): any {
    var columnList = [];
    var results = db.all('PRAGMA table_info(\'' + this.table_name + '\')');
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      var index = result[UserTableReader.GPKG_UTR_CID];
      var name = result[UserTableReader.GPKG_UTR_NAME];
      var type = result[UserTableReader.GPKG_UTR_TYPE];
      var notNull = result[UserTableReader.GPKG_UTR_NOT_NULL] === 1;
      var primarykey = result[UserTableReader.GPKG_UTR_PK] === 1;
      var max = undefined;
      if (type && type.lastIndexOf(')') === type.length - 1) {
        var maxStart = type.indexOf('(');
        if (maxStart > -1) {
          var maxString = type.substring(maxStart + 1, type.length - 1);
          if (maxString !== '') {
            max = parseInt(maxString);
            type = type.substring(0, maxStart);
          }
        }
      }
      var defaultValue = undefined;
      if (result[UserTableReader.GPKG_UTR_DFLT_VALUE]) {
        defaultValue = result[UserTableReader.GPKG_UTR_DFLT_VALUE].replace(/\\'/g, '');
      }
      var column = this.createColumnWithResults(result, index, name, type, max, notNull, defaultValue, primarykey);
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
  createColumnWithResults(result: any, index: number, name: string, type: string, max?: number, notNull?: boolean, defaultValue?: any, primaryKey?: boolean) {
    var dataType = DataTypes.fromName(type);
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
  createTable(tableName: string, columns: UserColumn[], requiredColumns?: string[]): any {
    return new UserTable(tableName, columns, requiredColumns);
  }
}
