import { UserColumn } from './userColumn';
import { UserRow } from './userRow';
import { UserTable } from './userTable';
import { GeoPackageConnection } from '../db/geoPackageConnection';
import { ResultSet } from '../db/resultSet';
import { SQLUtils } from '../db/sqlUtils';
import { SqliteQueryBuilder } from '../db/sqliteQueryBuilder';
import { UserResultSet } from './userResultSet';
import { DBValue } from '../db/dbValue';

/**
 * GeoPackage Connection used to define common functionality within different
 * connection types
 * @param <TColumn> column type
 * @param <TTable> table type
 * @param <TRow> row type
 * @param <TResult> result type
 */
export abstract class UserConnection<
  TColumn extends UserColumn,
  TTable extends UserTable<TColumn>,
  TRow extends UserRow<TColumn, TTable>,
  TResult extends UserResultSet<TColumn, TTable, TRow>,
> {
  /**
   * Connection
   */
  protected readonly connection: GeoPackageConnection;

  /**
   * Table
   */
  protected table: TTable;

  /**
   * Constructor
   * @param connection GeoPackage connection
   */
  protected constructor(connection: GeoPackageConnection) {
    this.connection = connection;
  }

  /**
   * Get the table
   * @return table
   */
  public getTable(): TTable {
    return this.table;
  }

  /**
   * Set the table
   * @param table table
   */
  public setTable(table: TTable): void {
    this.table = table;
  }

  /**
   * Create a result by wrapping the ResultSet
   * @param columns result set
   * @param resultSet result set
   * @param sql SQL statement
   * @param selectionArgs selection arguments
   * @return result
   */
  protected abstract createResult(
    columns: string[],
    resultSet: ResultSet,
    sql: string,
    selectionArgs: string[],
  ): TResult;

  /**
   * Perform raw query
   * @param sql
   * @param selectionArgs
   */
  public rawQuery(sql: string, selectionArgs: []): TResult {
    const resultSet = SQLUtils.query(this.connection, sql, selectionArgs);
    return this.createResult(undefined, resultSet, sql, selectionArgs);
  }

  /**
   * Perform raw query with specified columns
   * @param sql
   * @param columns
   * @param selectionArgs
   */
  public rawQueryWithColumns(sql: string, columns: string[], selectionArgs: any[]): TResult {
    const resultSet = SQLUtils.query(this.connection, sql, selectionArgs);
    return this.createResult(columns, resultSet, sql, selectionArgs);
  }

  /**
   * Perform query
   * @param distinct
   * @param tables
   * @param columns
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public query(
    distinct: boolean,
    tables: string,
    columns?: string[],
    where?: string,
    whereArgs?: any[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    const sql = this.querySQL(distinct, tables, columns, where, join, groupBy, having, orderBy, limit, offset);
    const resultSet = SQLUtils.query(this.connection, sql, whereArgs);
    return this.createResult(columns, resultSet, sql, whereArgs);
  }

  /**
   * Perform query
   * @param distinct
   * @param tables
   * @param columns
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public count(
    distinct: boolean,
    tables: string,
    columns?: string[],
    where?: string,
    whereArgs?: [] | DBValue[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    join?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    groupBy?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    having?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    orderBy?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    limit?: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    offset?: number,
  ): number {
    return SQLUtils.count(this.connection, tables, where, whereArgs);
  }

  /**
   * Get a count of results
   * @param table  table name
   * @param distinct  distinct column flag
   * @param column column name
   * @param where where clause
   * @param args arguments
   * @return count
   */
  public countColumn(table: string, distinct: boolean, column: string, where: string, args: any[]): number {
    let count = 0;
    const value = this.connection.aggregateFunction('COUNT', table, distinct, column, where, args);
    if (value != null) {
      count = value.intValue();
    }
    return count;
  }

  /**
   * {@inheritDoc}
   */
  public querySQL(
    distinct: boolean,
    tables: string,
    columns?: string[],
    where?: string,
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): string {
    return SqliteQueryBuilder.buildQuery(
      distinct,
      tables,
      columns,
      where,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Get the connection
   */
  public getConnection(): GeoPackageConnection {
    return this.connection;
  }
}
