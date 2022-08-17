import { UserColumn } from './userColumn';
import { UserResult } from './userResult';
import { UserRow } from './userRow';
import { UserTable } from './userTable';
import { ResultSetResult } from '../db/resultSetResult';
import { ResultSet } from '../db/resultSet';
import { UserColumns } from './userColumns';
import { GeoPackageException } from '../geoPackageException';

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
  TRow extends UserRow<TColumn, TTable>
> extends ResultSetResult implements UserResult<TColumn, TTable, TRow> {
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
  private selectionArgs: [];

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
    selectionArgs: [],
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
    this.count = resultSet.getCount();
    this.sql = sql;
    this.selectionArgs = selectionArgs;
  }

  /**
   * {@inheritDoc}
   */
  public getRowWithColumnTypesAndValues(columnTypes: number[], values: any[]): TRow {
    return new UserRow<TColumn, TTable>(this.getTable(), this.getColumns(), columnTypes, values) as TRow;
  }

  /**
   * {@inheritDoc}
   */
  public getValueForColumn(column: TColumn): any {
    return this.getValue(this.getValue(column.getName()));
  }

  /**
   * {@inheritDoc}
   */
  public getValueForIndex(index: number): any {
    return this.getValue(this.columns.getColumnForIndex(index).getName());
  }

  /**
   * {@inheritDoc}
   */
  public getValueForColumnName(columnName: string): any {
    return this.getValue(columnName);
  }

  /**
   * {@inheritDoc}
   */
  public getId(): number {
    let id = -1;

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

    return id;
  }

  /**
   * {@inheritDoc}
   */
  public getTable(): TTable {
    return this.table;
  }

  /**
   * {@inheritDoc}
   */
  public getTableName(): string {
    return this.table.getTableName();
  }

  /**
   * {@inheritDoc}
   */
  public getColumns(): UserColumns<TColumn> {
    return this.columns;
  }

  /**
   * {@inheritDoc}
   */
  public getRow(): TRow {
    const columnTypes = [];
    const values = [];

    try {
      for (let index = 0; index < this.columns.columnCount(); index++) {
        const column = this.columns.getColumnForIndex(index);
        values.push(this.getValueForColumn(column));
        columnTypes.push(column.getDataType());
      }
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve the row');
    }

    return this.getRowWithColumnTypesAndValues(columnTypes, values);
  }

  /**
   * {@inheritDoc}
   */
  public getCount(): number {
    if (this.count == null) {
      if (this.sql != null) {
        this.count = this.resultSet.getCount();
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
    const value = this.getRow();
    if (this.moveToNext()) {
      return {
        value: value,
        done: false,
      };
    } else {
      return {
        value: value,
        done: true,
      };
    }
  }

  /**
   * {@inheritDoc}
   */
  public getSql(): string {
    return this.sql;
  }

  /**
   * {@inheritDoc}
   */
  public getSelectionArgs(): [] {
    return this.selectionArgs;
  }

  /**
   * Next function for id
   * @private
   */
  private idNext(): { value: number; done: boolean } {
    const value = this.getId();
    if (this.moveToNext()) {
      return {
        value: value,
        done: false,
      };
    } else {
      return {
        value: value,
        done: true,
      };
    }
  }

  /**
   * {@inheritDoc}
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
