import { Pagination } from '../db/pagination';
import { UserColumn } from './userColumn';
import { UserDao } from './userDao';
import { UserResult } from './userResult';
import { UserResultSet } from './userResultSet';
import { UserRow } from './userRow';
import { UserTable } from './userTable';
import { GeoPackageException } from '../geoPackageException';

/**
 * User Core Paginated Results for iterating and querying through chunks
 *
 * @param <TColumn> column type
 * @param <TTable>  table type
 * @param <TRow> row type
 * @param <TResult> result type
 *
 */
export abstract class UserPaginatedResults<
  TColumn extends UserColumn,
  TTable extends UserTable<TColumn>,
  TRow extends UserRow<TColumn, TTable>,
  TResult extends UserResultSet<TColumn, TTable, TRow>,
> implements IterableIterator<TRow>
{
  /**
   * DAO
   */
  private readonly dao: UserDao<TColumn, TTable, TRow, TResult>;

  /**
   * Results
   */
  private results: UserResultSet<TColumn, TTable, TRow>;

  /**
   * SQL statement
   */
  private readonly sql: string;

  /**
   * SQL arguments
   */
  private readonly args: any[];

  /**
   * SQL column names
   */
  private readonly columns: string[];

  /**
   * Paginated query settings
   */
  private pagination: Pagination;

  /**
   * Constructor
   * @param dao  user core dao
   * @param results  user core results
   */
  protected constructor(dao: UserDao<TColumn, TTable, TRow, TResult>, results: UserResultSet<TColumn, TTable, TRow>) {
    this.dao = dao;
    this.results = results;
    this.sql = results.getSql();
    this.columns = results.getColumns().getColumnNames();
    this.args = results.getSelectionArgs();
    this.pagination = Pagination.find(this.sql);
    if (this.pagination == null) {
      throw new GeoPackageException('Results are not paginated. SQL: ' + this.sql);
    }
  }

  /**
   * Get the DAO
   * @return data access object
   */
  public getDao(): UserDao<TColumn, TTable, TRow, TResult> {
    return this.dao;
  }

  /**
   * Get the current paginated results
   * @return current results
   */
  public getResults(): UserResult<TColumn, TTable, TRow> {
    return this.results;
  }

  /**
   * Get the initial SQL statement
   * @return SQL statement
   */
  public getSql(): string {
    return this.sql;
  }

  /**
   * Get the SQL arguments
   * @return SQL arguments
   */
  public getArgs(): string[] {
    return this.args;
  }

  /**
   * Get the SQL column names
   * @return SQL column names
   */
  public getColumns(): string[] {
    return this.columns;
  }

  /**
   * Get the pagination
   * @return pagination
   */
  public getPagination(): Pagination {
    return this.pagination;
  }

  /**
   * Set the pagination
   * @param pagination pagination
   */
  public setPagination(pagination: Pagination): void {
    this.pagination = pagination;
  }

  [Symbol.iterator](): IterableIterator<TRow> {
    return this;
  }

  /**
   * Private function for handling end of page and moving to next page and verifying when results have run out.
   * @private
   */
  private hasNext(): boolean {
    let hasNext;
    if (this.results.moveToNext()) {
      hasNext = true;
    } else {
      this.close();
      if (this.pagination.hasLimit()) {
        this.pagination.incrementOffset();
        const query = this.pagination.replace(this.sql);
        this.results = this.dao.rawQueryWithColumns(query, this.columns, this.args);
        hasNext = this.results.moveToNext();
        if (!hasNext) {
          this.close();
        }
      }
    }
    return hasNext;
  }

  public next(): { value: TRow; done: boolean } {
    const value = this.results.getRow();
    const done = !this.hasNext();
    return {
      value,
      done,
    };
  }

  /**
   * Next function for id
   * @private
   */
  private idNext(): { value: number; done: boolean } {
    const value = this.results.getId();
    const done = !this.hasNext();
    return {
      value,
      done,
    };
  }

  /**
   * @inheritDoc
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

  /**
   * Close the current results
   */
  public close(): void {
    // this.results.close();
  }
}
