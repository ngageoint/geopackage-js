import { UserColumn } from './userColumn';
import { UserResult } from './userResult';
import { UserRow } from './userRow';
import { UserTable } from './userTable';
import { ResultSetResult } from '../db/resultSetResult';
import { ResultSet } from '../db/resultSet';
import { UserColumns } from './userColumns';
import { GeoPackageException } from '../geoPackageException';
import { SQLUtils } from '../db/sqlUtils';

/**
 * Abstract User Result Set. The column index of the GeoPackage core is 0
 * indexed based and ResultSets are 1 indexed based.
 *
 * @param <TColumn>
 *            column type
 * @param <TTable>
 *            table type
 * @param <TRow>
 *            row type
 */
export abstract class UserResultSet<
    TColumn extends UserColumn,
    TTable extends UserTable<TColumn>,
    TRow extends UserRow<TColumn, TTable>,
  >
  extends ResultSetResult
  implements UserResult<TColumn, TTable, TRow>
{
  /**
   * Table
   */
  private readonly table: TTable;

  /**
   * Columns
   */
  private readonly columns: UserColumns<TColumn>;

  /**
   * Result count
   */
  private count: number;

  /**
   * Executed SQL command
   */
  private sql: string;

  /**
   * Selection arguments
   */
  private selectionArgs: any[];

  /**
   * Constructor
   * @param table
   * @param columns
   * @param resultSet
   * @param sql
   * @param selectionArgs
   * @protected
   */
  protected constructor(
    table: TTable,
    columns: string[] | UserColumns<TColumn>,
    resultSet: ResultSet,
    sql: string,
    selectionArgs: any[],
  ) {
    super(resultSet);
    this.table = table;
    if (columns instanceof UserColumns) {
      this.columns = columns;
    } else if (columns != null) {
      this.columns = table.createUserColumnsFromColumnNames(columns);
    } else {
      this.columns = table.getUserColumns();
    }
    this.sql = sql;
    this.selectionArgs = selectionArgs;
  }

  /**
   * Get the row with provided column types and values
   * @return a user row
   */
  public getRowWithColumnTypesAndValues(columnTypes: number[], values: any[]): TRow {
    return new UserRow<TColumn, TTable>(this.getTable(), this.getColumns(), columnTypes, values) as TRow;
  }

  /**
   * Gets the value for a given column
   * @param column
   * @return {any}
   */
  public getValueForColumn(column: TColumn): any {
    return this.getValue(column.getName());
  }

  /**
   * Gets the value for a given index
   * @param index
   * @return {any}
   */
  public getValueForIndex(index: number): any {
    return this.getValue(this.columns.getColumnForIndex(index).getName());
  }

  /**
   * Get the value for a given column name
   * @param {string} columnName
   * @return {any}
   */
  public getValueForColumnName(columnName: string): any {
    return this.getValue(columnName);
  }

  /**
   * Get the id
   * @return {number} the id
   */
  public getId(): number {
    let id = -1;

    if (this.resultSet.hasValue()) {
      const pkColumn = this.columns.getPkColumn();
      if (pkColumn == null) {
        const error = ['No primary key column in '];
        if (this.columns.isCustom()) {
          error.push('custom specified table columns. ');
        }
        error.push('table: ' + this.columns.getTableName());
        if (this.columns.isCustom()) {
          error.push(', columns: ' + this.columns.getColumnNames());
        }
        throw new GeoPackageException(error.join(''));
      }

      const objectValue = this.getValueForColumn(pkColumn);
      if (typeof objectValue === 'number') {
        id = objectValue;
      } else {
        throw new GeoPackageException(
          'Primary Key value was not a number. table: ' +
            this.columns.getTableName() +
            ', index: ' +
            pkColumn.getIndex() +
            ', name: ' +
            pkColumn.getName() +
            ', value: ' +
            objectValue,
        );
      }
    }

    return id;
  }

  /**
   * Get the table
   * @return table
   */
  public getTable(): TTable {
    return this.table;
  }

  /**
   * Get the table name
   * @return {string} table name
   */
  public getTableName(): string {
    return this.table.getTableName();
  }

  /**
   * Get the columns
   * @return columns
   */
  public getColumns(): UserColumns<TColumn> {
    return this.columns;
  }

  /**
   * Get the row
   * @return row
   */
  public getRow(): TRow {
    let row: TRow;
    if (this.resultSet.hasValue()) {
      const columnTypes = [];
      const values = [];

      try {
        for (let index = 0; index < this.columns.columnCount(); index++) {
          const column = this.columns.getColumnForIndex(index);
          values.push(this.getValueForColumn(column));
          columnTypes.push(column.getDataType());
        }
      } catch (e) {
        console.error(e);
        throw new GeoPackageException('Failed to retrieve the row');
      }
      row = this.getRowWithColumnTypesAndValues(columnTypes, values);
    }

    return row;
  }

  /**
   * Get a count of the records in this result set
   * @return {number} count
   */
  public getCount(): number {
    if (this.count == null) {
      if (this.sql != null) {
        this.count = SQLUtils.countSqlQuery(this.resultSet.getConnection(), this.sql, this.selectionArgs);
      } else {
        this.count = -1;
      }
    }
    return this.count;
  }

  [Symbol.iterator](): IterableIterator<TRow> {
    return this;
  }

  public next(): { value: TRow; done: boolean } {
    if (this.moveToNext()) {
      return {
        value: this.getRow(),
        done: false,
      };
    } else {
      return {
        value: this.getRow(),
        done: true,
      };
    }
  }

  /**
   * Get the sql
   * @return {string} sql
   */
  public getSql(): string {
    return this.sql;
  }

  /**
   * Get the sql arguments
   * @return {any[]} args
   */
  public getSelectionArgs(): any[] {
    return this.selectionArgs;
  }

  /**
   * Next function for id
   * @private
   */
  private idNext(): { value: number; done: boolean } {
    if (this.moveToNext()) {
      return {
        value: this.getId(),
        done: false,
      };
    } else {
      return {
        value: this.getId(),
        done: true,
      };
    }
  }

  /**
   * Get an iterator for id values
   */
  public ids(): IterableIterator<number> {
    const idNext = this.idNext;
    return {
      [Symbol.iterator](): IterableIterator<number> {
        return this;
      },
      next: idNext,
    };
  }
}
