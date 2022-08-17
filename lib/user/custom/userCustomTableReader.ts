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
   * @inheritDoc
   */
  createTable(tableName: string, columns: UserCustomColumn[]): UserCustomTable {
    return new UserCustomTable(tableName, columns, null);
  }

  /**
   * @inheritDoc
   */
  createColumn(tableColumn: TableColumn): UserCustomColumn {
    return UserCustomColumn.createColumnWithTableColumn(tableColumn);
  }
}
