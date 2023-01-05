/**
 * @module user/custom
 */
import { UserCustomTable } from './userCustomTable';
import { UserTableReader } from '../userTableReader';
import { UserCustomColumn } from './userCustomColumn';
import { TableColumn } from '../../db/table/tableColumn';
import { GeoPackageConnection } from '../../db/geoPackageConnection';

/**
 * User custom table reader
 * @class
 * @param  {string} tableName       table name
 * @param  {string[]} requiredColumns required columns
 */
export class UserCustomTableReader extends UserTableReader<UserCustomColumn, UserCustomTable> {
  constructor(tableName: string) {
    super(tableName);
  }

  public static readUserCustomTable(connection: GeoPackageConnection, tableName: string): UserCustomTable {
    const tableReader = new UserCustomTableReader(tableName);
    return tableReader.readTable(connection);
  }

  /**
   * Create the UserCustomTable
   * @param {string} tableName
   * @param {UserCustomColumn[]} columns
   * @return {UserCustomTable}
   */
  createTable(tableName: string, columns: UserCustomColumn[]): UserCustomTable {
    return new UserCustomTable(tableName, columns, null);
  }

  /**
   * Create a UserCustomColumn
   * @param {TableColumn} tableColumn
   * @return {UserCustomColumn}
   */
  createColumn(tableColumn: TableColumn): UserCustomColumn {
    return UserCustomColumn.createColumnWithTableColumn(tableColumn);
  }
}
