/**
 * userTableReader module.
 * @module user/userTableReader
 */
import { UserTable } from './userTable';
import { UserColumn } from './userColumn';
import { GeoPackageConnection } from '../db/geoPackageConnection';
import { TableInfo } from '../db/table/tableInfo';
import { SQLiteMaster } from '../db/master/sqliteMaster';
import { TableColumn } from '../db/table/tableColumn';
import { GeoPackageException } from '../geoPackageException';

/**
 * @class
 */
export abstract class UserTableReader<TColumn extends UserColumn, TTable extends UserTable<TColumn>> {
  /**
   * Table name
   */
  private readonly tableName: string;

  /**
   * @param tableName name of the table
   */
  protected constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Creates a user column
   */
  abstract createColumn(tableColumn: TableColumn): TColumn;

  /**
   * Creates a user column
   */
  abstract createTable(tableName: string, columnList: TColumn[]): TTable;

  /**
   * Read the table
   * @param db connection
   * @return table
   */
  public readTable(db: GeoPackageConnection): TTable {
    const columnList: TColumn[] = [];

    const tableInfo = TableInfo.info(db, this.tableName);
    if (tableInfo === null || tableInfo === undefined) {
      throw new GeoPackageException('Table does not exist: ' + this.tableName);
    }

    const constraints = SQLiteMaster.queryForConstraints(db, this.tableName);

    tableInfo.getColumns().forEach(tableColumn => {
      if (tableColumn.getDataType() === null || tableColumn.getDataType() === undefined) {
        throw new GeoPackageException('Unsupported column data type ' + tableColumn.getType());
      }
      const column = this.createColumn(tableColumn);

      const columnConstraints = constraints.getColumnConstraints(column.getName());
      if (columnConstraints !== null && columnConstraints !== undefined && columnConstraints.hasConstraints()) {
        column.clearConstraints();
        column.addConstraints(columnConstraints.constraints);
      }

      columnList.push(column);
    });

    const table: TTable = this.createTable(this.tableName, columnList);
    table.addConstraintsWithConstraints(constraints.getTableConstraints());
    return table;
  }
}
