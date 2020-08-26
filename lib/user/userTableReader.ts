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

/**
 * @class
 */
export abstract class UserTableReader<TColumn extends UserColumn, TTable extends UserTable<TColumn>> {
  /**
   * @param table_name name of the table
   */
  protected constructor(public table_name: string) {}

  /**
   * Read the table
   * @param db connection
   * @return table
   */
  readTable(db: GeoPackageConnection): TTable {
    const columnList: TColumn[] = [];

    let tableInfo = TableInfo.info(db, this.table_name);
    if (tableInfo === null || tableInfo === undefined) {
      throw new Error("Table does not exist: " + this.table_name);
    }

    let constraints = SQLiteMaster.queryForConstraints(db, this.table_name);

    tableInfo.getColumns().forEach(tableColumn => {
      if (tableColumn.getDataType() === null || tableColumn.getDataType() === undefined) {
        throw new Error('Unsupported column data type ' + tableColumn.getType());
      }
      let column = this.createColumn(tableColumn);

      let columnConstraints = constraints.getColumnConstraints(column.getName());
      if (columnConstraints !== null && columnConstraints !== undefined && columnConstraints.hasConstraints()) {
        column.clearConstraints();
        column.addConstraints(columnConstraints.constraints);
      }

      columnList.push(column);
    });

    let table: TTable = this.createTable(this.table_name, columnList);
    table.addConstraints(constraints.getTableConstraints());
    return table;
  }

  /**
   * Creates a user column
   */
  createColumn(tableColumn: TableColumn): TColumn {
    return new UserColumn(tableColumn.index, tableColumn.name, tableColumn.dataType, tableColumn.max, tableColumn.notNull, tableColumn.defaultValue, tableColumn.primaryKey, tableColumn.autoincrement) as TColumn;
  }

  /**
   * Creates a user column
   */
  abstract createTable(tableName: string, columnList: TColumn[]): TTable;
}
