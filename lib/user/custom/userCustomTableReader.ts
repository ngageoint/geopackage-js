/**
 * @module user/custom
 */
import { UserCustomTable } from './userCustomTable';
import { UserTableReader } from '../userTableReader';
import { UserCustomColumn } from './userCustomColumn';
import { GeoPackage } from '../../geoPackage';
import { TableColumn } from '../../db/table/tableColumn';

/**
 * User custom table reader
 * @class
 * @param  {string} tableName       table name
 * @param  {string[]} requiredColumns required columns
 */
export class UserCustomTableReader extends UserTableReader<UserCustomColumn, UserCustomTable> {
  constructor(table_name: string) {
    super(table_name);
  }

  readUserCustomTable(geoPackage: GeoPackage): UserCustomTable {
    return this.readTable(geoPackage.database) as UserCustomTable;
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
    return new UserCustomColumn(tableColumn.index, tableColumn.name, tableColumn.dataType, tableColumn.max, tableColumn.notNull, tableColumn.defaultValue, tableColumn.primaryKey);
  }
}
