import { MappedColumn } from './mappedColumn';
import { UserColumn } from '../user/userColumn';
import { TableInfo } from './table/tableInfo';

/**
 * Mapping between column names being mapped to and the mapped column
 * information
 *
 * @author osbornb
 */
export class TableMapping {
  /**
   * From table name
   */
  _fromTable: string;

  /**
   * To table name
   */
  _toTable: string;

  /**
   * Transfer row content to new table
   */
  _transferContent = true;

  /**
   * Mapping between column names and mapped columns
   */
  _columns = {};

  /**
   * Dropped columns from the previous table version
   */
  _droppedColumns = new Set<string>();

  /**
   * Custom where clause (in addition to column where mappings)
   */
  _where: string;

  /**
   * Constructor
   * @param fromTableName table name
   * @param toTableName table name
   * @param columns user columns
   */
  constructor(fromTableName: string, toTableName: string, columns: UserColumn[]) {
    this._fromTable = fromTableName;
    this._toTable = toTableName;
    columns.forEach((column) => {
      this.addMappedColumn(
        new MappedColumn(column.getName(), column.getName(), column.getDefaultValue(), column.getDataType()),
      );
    });
  }

  static fromTableInfo(tableInfo: TableInfo): TableMapping {
    const tableMapping = new TableMapping(tableInfo.getTableName(), tableInfo.getTableName(), []);
    tableInfo.getColumns().forEach((column) => {
      tableMapping.addMappedColumn(
        new MappedColumn(column.getName(), column.getName(), column.getDefaultValue(), column.getDataType()),
      );
    });
    return tableMapping;
  }

  /**
   * Get the from table name
   * @return from table name
   */
  get fromTable(): string {
    return this._fromTable;
  }

  /**
   * Set the from table name
   * @param fromTable from table name
   */
  set fromTable(fromTable: string) {
    this._fromTable = fromTable;
  }

  /**
   * Get the to table name
   * @return to table name
   */
  get toTable(): string {
    return this._toTable;
  }

  /**
   * Set the to table name
   * @param toTable to table name
   */
  set toTable(toTable: string) {
    this._toTable = toTable;
  }

  /**
   * Check if the table mapping is to a new table
   * @return true if a new table
   */
  isNewTable(): boolean {
    return this._toTable != null && this._toTable !== this._fromTable;
  }

  /**
   * Is the transfer content flag enabled
   * @return true if data should be transfered to the new table
   */
  isTransferContent(): boolean {
    return this._transferContent;
  }

  /**
   * Set the transfer content flag
   * @param transferContent true if data should be transfered to the new table
   */
  set transferContent(transferContent: boolean) {
    this._transferContent = transferContent;
  }

  /**
   * Add a column
   * @param column mapped column
   */
  addMappedColumn(column: MappedColumn): void {
    this._columns[column.toColumn] = column;
  }

  /**
   * Add a column
   * @param columnName column name
   */
  addColumnWithName(columnName: string): void {
    this._columns[columnName] = new MappedColumn(columnName, null, null, null);
  }

  /**
   * Remove a column
   *
   * @param columnName
   *            column name
   * @return removed mapped column or null
   */
  removeColumn(columnName: string): UserColumn {
    const removedColumn = this._columns[columnName];
    delete this._columns[columnName];
    return removedColumn;
  }

  /**
   * Get the column names
   * @return column names
   */
  getColumnNames(): string[] {
    return Object.keys(this._columns);
  }

  /**
   * Get the columns as an entry set
   * @return columns
   */
  getColumns(): any {
    return this._columns;
  }

  /**
   * Get the mapped column values
   * @return columns
   */
  getMappedColumns(): MappedColumn[] {
    return Object.values(this._columns);
  }

  /**
   * Get the mapped column for the column name
   * @param columnName column name
   * @return mapped column
   */
  getColumn(columnName: string): MappedColumn {
    return this._columns[columnName];
  }

  /**
   * Add a dropped column
   * @param columnName column name
   */
  addDroppedColumn(columnName: string): void {
    this._droppedColumns.add(columnName);
  }

  /**
   * Remove a dropped column
   * @param columnName column name
   * @return true if removed
   */
  removeDroppedColumn(columnName: string): boolean {
    return this._droppedColumns.delete(columnName);
  }

  /**
   * Get a set of dropped columns
   * @return dropped columns
   */
  get droppedColumns(): Set<string> {
    return this._droppedColumns;
  }

  /**
   * Check if the column name is a dropped column
   * @param columnName column name
   * @return true if a dropped column
   */
  isDroppedColumn(columnName: string): boolean {
    return this._droppedColumns.has(columnName);
  }

  /**
   * Check if there is a custom where clause
   * @return true if where clause
   */
  hasWhere(): boolean {
    return this._where != null;
  }

  /**
   * Get the where clause
   * @return where clause
   */
  get where(): string {
    return this._where;
  }

  /**
   * Set the where clause
   * @param where where clause
   */
  set where(where: string) {
    this._where = where;
  }
}
