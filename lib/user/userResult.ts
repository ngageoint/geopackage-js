import { UserColumn } from './userColumn';
import { UserTable } from './userTable';
import { UserRow } from './userRow';
import { Result } from '../db/result';
import { UserColumns } from './userColumns';
import { GeoPackageConnection } from '../db/geoPackageConnection';

/**
 * Abstract User Cursor
 * @param <TColumn> column type
 * @param <TTable> table type
 * @param <TRow> row type
 */
export interface UserResult<
  TColumn extends UserColumn,
  TTable extends UserTable<TColumn>,
  TRow extends UserRow<TColumn, TTable>
> extends Result, IterableIterator<TRow> {
  /**
   * Get a row using the column types and values
   *
   * @param columnTypes column types
   * @param values values
   * @return row
   */
  getRowWithColumnTypesAndValues(columnTypes: number[], values: any[]): TRow;

  /**
   * Get the value for the column
   * @param column column
   * @return value
   */
  getValueForColumn(column: TColumn): any;

  /**
   * Get the value for the column index
   * @param index column index
   * @return value
   */
  getValueForIndex(index: number): any;

  /**
   * Get the value for the column name
   * @param columnName column name
   * @return value
   */
  getValueForColumnName(columnName: string): any;

  /**
   * Get the primary key value
   *
   * @return value
   */
  getId(): number;

  /**
   * Get the table
   *
   * @return table
   */
  getTable(): TTable;

  /**
   * Get the table name
   *
   * @return table name
   */
  getTableName(): string;

  /**
   * Get the columns
   *
   * @return columns
   */
  getColumns(): UserColumns<TColumn>;

  /**
   * Get the row at the current cursor position
   *
   * @return row
   */
  getRow(): TRow;

  /**
   * Get the count of results
   *
   * @return count, -1 if not able to determine
   */
  getCount(connection: GeoPackageConnection): number;

  /**
   * Get the SQL statement (if available)
   *
   * @return SQL statement
   */
  getSql(): string;

  /**
   * Get the SQL selection arguments (if available)
   *
   * @return selection arguments
   */
  getSelectionArgs(): any[];

  /**
   * Iterable for iterating over result ids in place of rows
   *
   * @return iterable ids
   */
  ids(): IterableIterator<number>;
}
