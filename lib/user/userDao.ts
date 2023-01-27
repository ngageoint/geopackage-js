import { UserRow } from './userRow';
import { UserTable } from './userTable';
import { UserColumn } from './userColumn';
import { GeoPackageConnection } from '../db/geoPackageConnection';
import { UserConnection } from './userConnection';
import { Projection, ProjectionConstants, Projections } from '@ngageoint/projections-js';
import { BoundingBox } from '../boundingBox';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { Contents } from '../contents/contents';
import { GeoPackageException } from '../geoPackageException';
import { TileBoundingBoxUtils } from '../tiles/tileBoundingBoxUtils';
import { SQLUtils } from '../db/sqlUtils';
import { UserResultSet } from './userResultSet';
import { ColumnValue } from './columnValue';
import { AlterTable } from '../db/alterTable';
import { FieldValues } from '../dao/fieldValues';
import { DBValue } from '../db/dbValue';
import { ContentValues } from './contentValues';
import { ResultUtils } from '../db/resultUtils';
import { ResultSetResult } from '../db/resultSetResult';
import type { GeoPackage } from '../geoPackage';

/**
 * Abstract UserDao
 */
export abstract class UserDao<
  TColumn extends UserColumn,
  TTable extends UserTable<TColumn>,
  TRow extends UserRow<TColumn, TTable>,
  TResult extends UserResultSet<TColumn, TTable, TRow>,
> {
  /**
   * Connection
   */
  private readonly db: GeoPackageConnection;

  /**
   * GeoPackage
   */
  protected readonly geoPackage: GeoPackage;

  /**
   * Database
   */
  private readonly database: string;

  /**
   * User Database connection
   */
  private readonly userDb: UserConnection<TColumn, TTable, TRow, TResult>;

  /**
   * User table
   */
  private readonly table: TTable;

  /**
   * Projection
   */
  protected projection: Projection;

  protected constructor(
    database: string,
    geoPackage: GeoPackage,
    userDb: UserConnection<TColumn, TTable, TRow, TResult>,
    table: TTable,
  ) {
    this.geoPackage = geoPackage;
    this.database = database;
    this.userDb = userDb;
    this.table = table;
    this.db = geoPackage.getConnection();
    userDb.setTable(table);
  }

  /**
   * Get a new empty row
   * @return row
   */
  public abstract newRow(): TRow;

  /**
   * Get the bounding box of the user table data
   *
   * @return bounding box of user table data
   */
  protected abstract getBoundingBox(): BoundingBox;

  /**
   * Get the bounding box of the user table data
   *
   * @param projection desired projection
   *
   * @return bounding box of user table data
   */
  protected abstract getBoundingBoxWithProjection(projection: Projection): BoundingBox;

  /**
   * Project the provided bounding box in the declared projection to the user
   * DAO projection
   *
   * @param boundingBox
   *            bounding box
   * @param projection
   *            projection
   * @return projected bounding box
   */
  public projectBoundingBox(boundingBox: BoundingBox, projection: Projection): BoundingBox {
    const projectionTransform = GeometryTransform.create(projection, this.getProjection());
    return boundingBox.transform(projectionTransform);
  }

  /**
   * Prepare the result before returning
   * @param result result
   * @return prepared result
   */
  protected prepareResult(result: TResult): TResult {
    return result;
  }

  /**
   * Get the database
   *
   * @return database
   */
  public getDatabase(): string {
    return this.database;
  }

  /**
   * Get the GeoPackage
   */
  public getGeoPackage(): GeoPackage {
    return this.geoPackage;
  }

  /**
   * Get the database connection
   *
   * @return database connection
   */
  public getDb(): GeoPackageConnection {
    return this.db;
  }

  /**
   * Get the user database connection
   *
   * @return user database connection
   */
  public getUserDb(): UserConnection<TColumn, TTable, TRow, TResult> {
    return this.userDb;
  }

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.table.getTableName();
  }

  /**
   * Get the table
   *
   * @return table
   */
  public getTable(): TTable {
    return this.table;
  }

  /**
   * Check if the table has a primary key column
   *
   * @return true if has a primary key
   */
  public hasPkColumn(): boolean {
    return this.table.getUserColumns().hasPkColumn();
  }

  /**
   * Get the primary key column index
   *
   * @return primary key column index
   */
  public getPkColumnIndex(): number {
    return this.table.getPkColumnIndex();
  }

  /**
   * Get the primary key column
   *
   * @return primary key column
   */
  public getPkColumn(): TColumn {
    return this.table.getPkColumn();
  }

  /**
   * Get the primary key column name
   *
   * @return primary key column name
   */
  public getPkColumnName(): string {
    return this.table.getPkColumnName();
  }

  /**
   * Get the table columns
   * @return columns
   */
  public getColumns(): TColumn[] {
    return this.table.getColumns();
  }

  /**
   * Get the table column names
   *
   * @return column names
   */
  public getColumnNames(): string[] {
    return this.table.getColumnNames();
  }

  /**
   * Get the column count
   *
   * @return column count
   */
  public columnCount(): number {
    return this.table.columnCount();
  }

  /**
   * Get the contents
   *
   * @return contents
   */
  public getContents(): Contents {
    return this.table.getContents();
  }

  /**
   * Get the projection
   *
   * @return projection
   */
  public getProjection(): Projection {
    return this.projection;
  }

  /**
   * Is the primary key modifiable
   *
   * @return true if the primary key is modifiable
   */
  public isPkModifiable(): boolean {
    return this.table.isPkModifiable();
  }

  /**
   * Set if the primary key can be modified
   *
   * @param pkModifiable primary key modifiable flag
   */
  public setPkModifiable(pkModifiable: boolean): void {
    this.table.setPkModifiable(pkModifiable);
  }

  /**
   * Is value validation against column types enabled
   *
   * @return true if values are validated against column types
   */
  public isValueValidation(): boolean {
    return this.table.isValueValidation();
  }

  /**
   * Set if values should validated against column types
   *
   * @param valueValidation
   *            value validation flag
   */
  public setValueValidation(valueValidation: boolean): void {
    this.table.setValueValidation(valueValidation);
  }

  /**
   * Drop the user table
   */
  public dropTable(): void {
    SQLUtils.dropTable(this.db, this.getTableName());
  }

  /**
   * Raw query
   * @param sql SQL
   * @param selectionArgs selection args
   * @return result
   */
  public rawQueryWithArgs(sql: string, selectionArgs?: []): TResult {
    return this.userDb.rawQuery(sql, selectionArgs);
  }

  /**
   * Raw query
   * @param sql SQL
   * @param columns subset of table columns defined in the SQL
   * @param selectionArgs selection args
   * @return result
   */
  public rawQueryWithColumns(sql: string, columns: string[], selectionArgs: any[]): TResult {
    return this.userDb.rawQueryWithColumns(sql, columns, selectionArgs);
  }

  /**
   * Query for all rows
   * @return result
   */
  public queryForAll(): TResult {
    return this.query();
  }

  /**
   * Query for rows by ids in the nested SQL query
   *
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @return result
   */
  public queryIn(nestedSQL?: string, nestedArgs?: any[], where?: string, whereArgs?: any[]): TResult {
    return this.queryInWithDistinctAndColumns(undefined, undefined, nestedSQL, nestedArgs, where, whereArgs);
  }

  /**
   * Query for rows by ids in the nested SQL query
   *
   * @param distinct distinct rows
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @return result
   */
  public queryInWithDistinct(
    distinct: boolean,
    nestedSQL?: string,
    nestedArgs?: any[],
    where?: string,
    whereArgs?: any[],
  ): TResult {
    return this.queryInWithDistinctAndColumns(distinct, undefined, nestedSQL, nestedArgs, where, whereArgs);
  }

  /**
   * Query for rows by ids in the nested SQL query
   *
   * @param columns columns
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @return result
   */
  public queryInWithColumns(
    columns: string[],
    nestedSQL?: string,
    nestedArgs?: any[],
    where?: string,
    whereArgs?: any[],
  ): TResult {
    return this.queryInWithDistinctAndColumns(undefined, columns, nestedSQL, nestedArgs, where, whereArgs);
  }

  /**
   * Query for rows by ids in the nested SQL query
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @return result
   */
  public queryInWithDistinctAndColumns(
    distinct?: boolean,
    columns?: string[],
    nestedSQL?: string,
    nestedArgs?: any[],
    where?: string,
    whereArgs?: any[],
  ): TResult {
    const whereClause = this.buildWhereIn(nestedSQL, where);
    const args = this.buildWhereInArgs(nestedArgs, whereArgs);
    return this.queryWithDistinctAndColumns(distinct, columns, whereClause, args);
  }

  /**
   * Query for ordered rows by ids in the nested SQL query, starting at the
   * offset and returning no more than the limit.
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @param groupBy group by
   * @param having having
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk offset
   * @return result
   */
  public queryInForChunk(
    nestedSQL?: string,
    nestedArgs?: any[],
    where?: string,
    whereArgs?: any[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryInForChunkWithDistinctAndColumns(
      undefined,
      undefined,
      nestedSQL,
      nestedArgs,
      where,
      whereArgs,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for ordered rows by ids in the nested SQL query, starting at the
   * offset and returning no more than the limit.
   * @param distinct distinct rows
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @param groupBy group by
   * @param having having
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk offset
   * @return result
   */
  public queryInForChunkWithDistinct(
    distinct: boolean,
    nestedSQL?: string,
    nestedArgs?: any[],
    where?: string,
    whereArgs?: any[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryInForChunkWithDistinctAndColumns(
      distinct,
      undefined,
      nestedSQL,
      nestedArgs,
      where,
      whereArgs,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for ordered rows by ids in the nested SQL query, starting at the
   * offset and returning no more than the limit.
   * @param columns columns
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @param groupBy group by
   * @param having having
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk offset
   * @return result
   */
  public queryInForChunkWithColumns(
    columns: string[],
    nestedSQL?: string,
    nestedArgs?: any[],
    where?: string,
    whereArgs?: any[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryInForChunkWithDistinctAndColumns(
      undefined,
      columns,
      nestedSQL,
      nestedArgs,
      where,
      whereArgs,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for ordered rows by ids in the nested SQL query, starting at the
   * offset and returning no more than the limit.
   * @param distinct distinct rows
   * @param columns columns
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @param groupBy group by
   * @param having having
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk offset
   * @return result
   */
  public queryInForChunkWithDistinctAndColumns(
    distinct: boolean,
    columns: string[],
    nestedSQL?: string,
    nestedArgs?: any[],
    where?: string,
    whereArgs?: any[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    const whereClause = this.buildWhereIn(nestedSQL, where);
    const args = this.buildWhereInArgs(nestedArgs, whereArgs);
    return this.queryForChunkWithDistinctAndColumns(
      distinct,
      columns,
      whereClause,
      args,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query
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
    where?: string,
    whereArgs?: any[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryWithDistinctAndColumns(
      false,
      undefined,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query
   * @param distinct
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public queryWithDistinct(
    distinct: boolean,
    where?: string,
    whereArgs?: any[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryWithDistinctAndColumns(
      distinct,
      undefined,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query
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
  public queryWithColumns(
    columns: string[],
    where?: string,
    whereArgs?: any[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryWithDistinctAndColumns(
      false,
      columns,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query
   * @param distinct
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
  public queryWithDistinctAndColumns(
    distinct = false,
    columns: string[] = this.table.getColumnNames(),
    where?: string,
    whereArgs?: any[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    const result = this.userDb.query(
      distinct,
      SQLUtils.quoteWrap(this.getTableName()),
      columns,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
    this.prepareResult(result);
    return result;
  }

  /**
   * Get a count of results
   * @param distinct
   * @param column
   * @param where
   * @param whereArgs
   */
  public countColumn(distinct: boolean, column: string, where: string, whereArgs: any[]): number {
    return this.userDb.countColumn(this.getTableName(), distinct, column, where, whereArgs);
  }

  /**
   * Gets the count
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public getCount(
    where?: string,
    whereArgs?: [] | DBValue[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): number {
    return this.getCountWithDistinctAndColumns(
      undefined,
      undefined,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Gets the count
   * @param distinct
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public getCountWithDistinct(
    distinct = false,
    where?: string,
    whereArgs?: [] | DBValue[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): number {
    return this.getCountWithDistinctAndColumns(
      distinct,
      undefined,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Gets the count
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
  public getCountWithColumns(
    columns: string[] = this.table.getColumnNames(),
    where?: string,
    whereArgs?: [] | DBValue[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): number {
    return this.getCountWithDistinctAndColumns(
      undefined,
      columns,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Gets the count
   * @param distinct
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
  public getCountWithDistinctAndColumns(
    distinct = false,
    columns: string[] = this.table.getColumnNames(),
    where?: string,
    whereArgs?: [] | DBValue[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): number {
    return this.userDb.count(
      distinct,
      this.getTableName(),
      columns,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Count
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
    where?: string,
    whereArgs?: [] | DBValue[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): number {
    return this.countWithDistinctAndColumns(
      undefined,
      undefined,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Count
   * @param distinct
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public countWithDistinct(
    distinct = false,
    where?: string,
    whereArgs?: [] | DBValue[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): number {
    return this.countWithDistinctAndColumns(
      distinct,
      undefined,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Count
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
  public countWithColumns(
    columns: string[] = this.table.getColumnNames(),
    where?: string,
    whereArgs?: [] | DBValue[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): number {
    return this.countWithDistinctAndColumns(
      undefined,
      columns,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Count
   * @param distinct
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
  public countWithDistinctAndColumns(
    distinct = false,
    columns: string[] = this.table.getColumnNames(),
    where?: string,
    whereArgs?: any[] | DBValue[],
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): number {
    return this.userDb.count(
      distinct,
      this.getTableName(),
      columns,
      where,
      whereArgs,
      join,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Get the count in the nested SQL query
   * @param column count column name
   * @param nestedSQL nested SQL
   * @return count
   */
  public countColumnIn(column: string, nestedSQL: string): number {
    return this.countInWithColumn(column, nestedSQL);
  }

  /**
   * Get the count in the nested SQL query
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countIn(nestedSQL?: string, nestedArgs?: string[], where?: string, whereArgs?: string[]): number {
    return this.countInWithDistinctAndColumn(undefined, undefined, nestedSQL, nestedArgs, where, whereArgs);
  }

  /**
   * Get the count in the nested SQL query
   * @param distinct distinct column values
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countInWithDistinct(
    distinct?: boolean,
    nestedSQL?: string,
    nestedArgs?: string[],
    where?: string,
    whereArgs?: string[],
  ): number {
    return this.countInWithDistinctAndColumn(distinct, undefined, nestedSQL, nestedArgs, where, whereArgs);
  }

  /**
   * Get the count in the nested SQL query
   * @param column count column name
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countInWithColumn(
    column?: string,
    nestedSQL?: string,
    nestedArgs?: string[],
    where?: string,
    whereArgs?: string[],
  ): number {
    return this.countInWithDistinctAndColumn(undefined, column, nestedSQL, nestedArgs, where, whereArgs);
  }

  /**
   * Get the count in the nested SQL query
   * @param distinct distinct column values
   * @param column count column name
   * @param nestedSQL nested SQL
   * @param nestedArgs nested SQL args
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countInWithDistinctAndColumn(
    distinct?: boolean,
    column?: string,
    nestedSQL?: string,
    nestedArgs?: string[],
    where?: string,
    whereArgs?: string[],
  ): number {
    const whereClause = this.buildWhereIn(nestedSQL, where);
    const args = this.buildWhereInArgs(nestedArgs, whereArgs);
    return this.db.countColumn(this.getTableName(), distinct, column, whereClause, args);
  }

  /**
   * Gets the rows in this table by id
   * @param  {Number[]} ids ids to query for
   * @return rows array
   */
  public queryForIdRows(ids: number[]): TRow[] {
    const rows: TRow[] = [];
    for (let i = 0; i < ids.length; i++) {
      const row = this.queryForIdRow(ids[i]);
      if (row) {
        rows.push(row);
      }
    }
    return rows;
  }

  /**
   * Query for the row with the provided id
   * @param id id
   * @return row
   */
  public queryForIdRow(id: number): TRow {
    let row = null;
    const readCursor = this.queryForId(id);
    if (readCursor.moveToNext()) {
      row = readCursor.getRow();
    }
    readCursor.close();
    return row;
  }

  /**
   * Query for the row with the provided id
   * @param id id
   * @return row
   */
  public queryForId(id: number): TResult {
    const where = this.getPkWhere(id);
    const whereArgs = this.getPkWhereArgs(id);
    return this.prepareResult(
      this.userDb.query(false, SQLUtils.quoteWrap(this.getTableName()), this.getColumnNames(), where, whereArgs),
    );
  }

  /**
   * Query the SQL for a single result object in the first column
   * @param sql sql statement
   * @param args sql arguments
   * @return single result object
   */
  public querySingleResult(sql: string, args: string[]): any {
    let value = null;
    const result = this.db.get(sql, args);
    if (result != null) {
      const keys = Object.keys(result);
      if (keys.length > 0) {
        value = result[keys[0]];
      }
    }
    return value;
  }

  /**
   * Query SQL for all row ids
   * @param distinct distinct rows
   * @param where where
   * @return SQL
   */
  public queryIdsSQL(distinct = false, where?: string): string {
    return this.querySQL(distinct, [this.table.getPkColumnName()], where);
  }

  /**
   * Query SQL for all rows
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param where where
   * @return SQL
   */
  public querySQL(distinct: boolean, columns: string[], where?: string): string {
    return this.userDb.querySQL(distinct, this.getTableName(), columns, where);
  }

  /**
   * Get the primary key where clause
   * @param id  id
   * @return primary key where clause
   */
  protected getPkWhere(id: number): string {
    return this.buildWhere(this.table.getPkColumnName(), id);
  }

  /**
   * Get the primary key where args
   * @param id  id
   * @return primary key where args
   */
  protected getPkWhereArgs(id: number): DBValue[] | null {
    return this.buildWhereArgs(id);
  }

  /**
   * Build where (or selection) statement for a single field
   * @param field field name
   * @param value field value
   * @return where clause
   */
  public buildWhere(field: string, value: any): string {
    return this.buildWhereWithOp(field, value, '=');
  }

  /**
   * Build where or selection statement for fields
   * @param  fields    columns and values
   * @param  [operation=AND] AND or OR
   * @return where clause
   */
  buildWhereWithFields(fields: FieldValues, operation = 'and'): string {
    let whereString = '';
    for (let i = 0; i < fields.columns.length; i++) {
      const column = fields.columns[i];
      const value = fields.values[i];
      if (i) {
        whereString += ' ' + operation + ' ';
      }
      whereString += this.buildWhere(column, value);
    }
    return whereString;
  }

  /**
   * Builds a where args array
   * @param {any[]|FieldValues|any} values argument values to push
   * @returns {any[]}
   */
  buildWhereArgsWithValues(values: DBValue[] | FieldValues | DBValue): any[] | null {
    let args = [];
    if (Array.isArray(values)) {
      args = this._buildWhereArgsWithArray(values);
    } else if (values instanceof FieldValues) {
      args = this._buildWhereArgsWithColumnValues(values);
    } else {
      if (values !== undefined && values !== null) {
        args.push(values);
      }
    }
    return args.length ? args : null;
  }

  /**
   * Builds a where args array
   * @param {any[]} values argument values to push
   * @returns {any[]}
   */
  _buildWhereArgsWithArray(values: DBValue[]): DBValue[] {
    const args = [];
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (value !== undefined && value !== null) {
        args.push(value);
      }
    }
    return args;
  }

  /**
   * Builds a where args array
   * @param {FieldValues} values argument values to push
   * @returns {any[]}
   */
  _buildWhereArgsWithColumnValues(values: FieldValues): DBValue[] {
    const args = [];
    for (let i = 0; i < values.columns.length; i++) {
      const value = values.values[i];
      if (value !== undefined && value !== null) {
        args.push(value);
      }
    }
    return args;
  }

  /**
   * Build where (or selection) LIKE statement for a single field
   * @param field field name
   * @param value field value
   * @return where clause
   */
  public buildWhereLike(field: string, value: any): string {
    return this.buildWhereWithOp(field, value, 'LIKE');
  }

  /**
   * Build where statement for ids in the nested SQL query
   * @param nestedSQL nested SQL
   * @param where where clause
   * @return where clause
   */
  public buildWhereIn(nestedSQL: string, where: string): string {
    const nestedWhere = SQLUtils.quoteWrap(this.table.getPkColumnName()) + ' IN (' + nestedSQL + ')';
    let whereClause;
    if (where == null) {
      whereClause = nestedWhere;
    } else {
      whereClause = '(' + where + ') AND (' + nestedWhere + ')';
    }
    return whereClause;
  }

  /**
   * Build where args for ids in the nested SQL query
   * @param nestedArgs nested SQL args
   * @param whereArgs where arguments
   * @return where args
   */
  public buildWhereInArgs(nestedArgs: any[], whereArgs: any[]): any[] {
    const args = [];
    if (whereArgs != null && whereArgs.length > 0) {
      args.push(...whereArgs);
    }
    if (nestedArgs != null && nestedArgs.length > 0) {
      args.push(...nestedArgs);
    }
    return args;
  }

  /**
   * Build where (or selection) statement for a single field using the
   * provided operation
   *
   * @param field field
   * @param value value
   * @param operation operation
   * @return where clause
   */
  public buildWhereWithOp(field: string, value: any, operation: string): string {
    return SQLUtils.quoteWrap(field) + ' ' + (value != null ? operation + ' ?' : 'IS NULL');
  }

  /**
   * Build where (or selection) args for the value
   * @param values value
   * @return where args
   */
  public buildWhereArgs(values: DBValue[] | FieldValues | DBValue): DBValue[] | null {
    let args: DBValue[] = [];
    if (Array.isArray(values)) {
      args = this._buildWhereArgsWithArray(values);
    } else if (values instanceof FieldValues) {
      args = this._buildWhereArgsWithColumnValues(values);
    } else {
      if (values !== undefined && values !== null) {
        args.push(values);
      }
    }
    return args.length ? args : null;
  }

  /**
   * Get the approximate zoom level of where the bounding box of the user data
   * fits into the world
   *
   * @return zoom level
   */
  public getZoomLevelForBoundingBox(): number {
    const projection = this.getProjection();
    if (projection == null) {
      throw new GeoPackageException('No projection was set which is required to determine the zoom level');
    }
    let zoomLevel = 0;
    let boundingBox = this.getBoundingBox();
    if (boundingBox != null) {
      if (Projections.getUnits(projection.toString()) === 'degrees') {
        boundingBox = BoundingBox.boundDegreesBoundingBoxWithWebMercatorLimits(boundingBox);
      }
      const webMercatorTransform = GeometryTransform.create(projection, ProjectionConstants.EPSG_WEB_MERCATOR);
      const webMercatorBoundingBox = boundingBox.transform(webMercatorTransform);
      zoomLevel = TileBoundingBoxUtils.getZoomLevel(webMercatorBoundingBox);
    }
    return zoomLevel;
  }

  /**
   * Query for the row where the field equals the value
   * @param fieldName field name
   * @param value value
   * @return result
   */
  public queryForEqWithFieldAndValue(fieldName: string, value: any): TResult {
    return this.queryForEq(fieldName, value);
  }

  /**
   * Count where all fields match their values
   * @param fieldValues field values
   * @return count
   */
  public countForFieldValues(fieldValues: FieldValues): number {
    const where = this.buildWhereWithFields(fieldValues);
    const whereArgs = this.buildWhereArgsWithValues(fieldValues);
    return this.count(where, whereArgs);
  }

  /**
   * Query for the row where the field equals the value
   * @param distinct
   * @param columns
   * @param fieldName
   * @param value
   * @param groupBy
   * @param having
   * @param orderBy
   */
  public countForEq(
    fieldName: string,
    value: any,
    distinct = false,
    columns: string[] = this.table.getColumnNames(),
    groupBy?: string,
    having?: string,
    orderBy?: string,
  ): number {
    const where = this.buildWhere(fieldName, value);
    const whereArgs = this.buildWhereArgs(value);
    return this.userDb.count(
      distinct,
      this.getTableName(),
      columns,
      where,
      whereArgs,
      undefined,
      groupBy,
      having,
      orderBy,
    );
  }

  /**
   * Query for ordered rows starting at the offset and returning no more than
   * the limit.
   * @param where
   * @param whereArgs
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public queryForChunk(
    where?: string,
    whereArgs?: any[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.query(where, whereArgs, undefined, groupBy, having, orderBy, limit, offset);
  }

  /**
   * Query for ordered rows starting at the offset and returning no more than
   * the limit.
   * @param distinct
   * @param where
   * @param whereArgs
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public queryForChunkWithDistinct(
    distinct = false,
    where?: string,
    whereArgs?: any[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryWithDistinct(distinct, where, whereArgs, undefined, groupBy, having, orderBy, limit, offset);
  }

  /**
   * Query for ordered rows starting at the offset and returning no more than
   * the limit.
   * @param columns
   * @param where
   * @param whereArgs
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public queryForChunkWithColumns(
    columns: string[] = this.table.getColumnNames(),
    where?: string,
    whereArgs?: any[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryWithColumns(columns, where, whereArgs, undefined, groupBy, having, orderBy, limit, offset);
  }

  /**
   * Query for ordered rows starting at the offset and returning no more than
   * the limit.
   * @param distinct
   * @param columns
   * @param where
   * @param whereArgs
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public queryForChunkWithDistinctAndColumns(
    distinct = false,
    columns: string[] = this.table.getColumnNames(),
    where?: string,
    whereArgs?: any[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): TResult {
    return this.queryWithDistinctAndColumns(
      distinct,
      columns,
      where,
      whereArgs,
      undefined,
      groupBy,
      having,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Build a limit String with the limit and offset
   * @param limit limit
   * @param offset offset
   * @return limit
   */
  public buildLimit(limit: number, offset: number): string {
    return offset + ',' + limit;
  }

  /**
   * Build a columns name array from the list of columns
   * @param columns column list
   * @return column names array
   */
  private buildColumnsArray(columns: TColumn[]): string[] {
    const columnsArray = [];
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      columnsArray[i] = column.getName();
    }
    return columnsArray;
  }

  /**
   * Get the value tolerance range min and max values
   * @param value
   * @return tolerance range
   */
  private getValueToleranceRange(value: ColumnValue): string[] {
    const doubleValue = Number.parseFloat(value.getValue());
    const tolerance = value.getTolerance();
    return [(doubleValue - tolerance).toString(), (doubleValue + tolerance).toString()];
  }

  /**
   * Add a new column
   * @param column new column
   */
  public addColumn(column: TColumn): void {
    AlterTable.addColumn(this.db, this.table.getTableName(), column.getName(), SQLUtils.columnDefinition(column));
    this.table.addColumn(column);
  }

  /**
   * Rename column
   * @param column column
   * @param newColumnName new column name
   */
  public renameColumn(column: TColumn, newColumnName: string): void {
    this.renameTableColumn(column.getName(), newColumnName);
  }

  /**
   * Rename column
   * @param columnName column name
   * @param newColumnName new column name
   */
  public renameColumnWithName(columnName: string, newColumnName: string): void {
    this.renameTableColumn(columnName, newColumnName);
  }

  /**
   * Rename column
   * @param index column index
   * @param newColumnName new column name
   */
  public renameColumnWithIndex(index: number, newColumnName: string): void {
    this.renameTableColumn(this.table.getColumnName(index), newColumnName);
  }

  /**
   * Rename a table column
   * @param columnName column name
   * @param newColumnName new column name
   */
  protected renameTableColumn(columnName: string, newColumnName: string): void {
    AlterTable.renameColumn(this.db, this.table.getTableName(), columnName, newColumnName);
    this.table.renameColumnWithName(columnName, newColumnName);
  }

  /**
   * Drop a column
   * @param column column
   */
  public dropColumn(column: TColumn): void {
    AlterTable.dropColumnForUserTable(this.db, this.table, column.getName());
  }

  /**
   * Drop a column
   * @param index column index
   */
  public dropColumnWithIndex(index: number): void {
    AlterTable.dropColumnForUserTable(this.db, this.table, this.table.getColumnName(index));
  }

  /**
   * Drop a column
   * @param columnName column name
   */
  public dropColumnWithName(columnName: string): void {
    AlterTable.dropColumnForUserTable(this.db, this.table, columnName);
  }

  /**
   * Drop columns
   * @param columns columns
   */
  public dropColumns(columns: TColumn[]): void {
    const columnNames = [];
    for (const column of columns) {
      columnNames.push(column.getName());
    }
    this.dropColumnNames(columnNames);
  }

  /**
   * Drop columns
   * @param indexes column indexes
   */
  public dropColumnIndexes(indexes: number[]): void {
    const columnNames = [];
    for (const index of indexes) {
      columnNames.push(this.table.getColumnName(index));
    }
    this.dropColumnNames(columnNames);
  }

  /**
   * Drop columns
   * @param columnNames column names
   */
  public dropColumnNames(columnNames: string[]): void {
    AlterTable.dropColumnsForUserTable(this.db, this.table, columnNames);
  }

  /**
   * Alter a column
   * @param column column
   */
  public alterColumn(column: TColumn): void {
    AlterTable.alterColumnForTable(this.db, this.table, column);
  }

  /**
   * Alter columns
   * @param columns columns
   */
  public alterColumns(columns: TColumn[]): void {
    AlterTable.alterColumnsForTable(this.db, this.table, columns);
  }

  /**
   * Delete the row passed in
   */
  public deleteRow(row: TRow): number {
    return this.deleteById(row.getId());
  }

  /**
   * Delete rows matching the where clause
   * @param whereClause where clause
   * @param whereArgs where arguments
   * @return deleted count
   */
  public delete(whereClause?: string, whereArgs?: any[]): number {
    return this.db.delete(this.getTableName(), whereClause, whereArgs);
  }

  /**
   * Delete all rows
   * @return deleted count
   */
  public deleteAll(): number {
    return this.db.delete(this.getTableName());
  }

  /**
   * Delete a row by id
   *
   * @param id
   *            id
   * @return number of rows affected, should be 0 or 1
   */
  public deleteById(id: number): number {
    return this.db.delete(this.getTableName(), this.getPkWhere(id), this.getPkWhereArgs(id));
  }

  /**
   * Delete rows matching the field values
   * @param fieldValues field values
   * @return deleted count
   */
  public deleteWithFieldValues(fieldValues: FieldValues): number {
    const whereClause = this.buildWhereWithFields(fieldValues);
    const whereArgs = this.buildWhereArgsWithValues(fieldValues);
    return this.delete(whereClause, whereArgs);
  }

  /**
   * Query for typed values from the first column
   * @param sql sql statement
   * @param args sql arguments
   * @param columnName
   * @param limit
   * @return single column values
   */
  public querySingleColumnTypedResults(sql: string, args: string[], columnName: string, limit?: number): any[] {
    const resultSet = this.db.query(sql, args);
    const value = ResultUtils.buildSingleColumnResults(new ResultSetResult(resultSet), columnName, limit);
    resultSet.close();
    return value;
  }

  /**
   * Query for typed values from the first column
   * @param sql sql statement
   * @param args sql arguments
   * @param columnIndex
   * @param limit
   * @return single column values
   */
  public querySingleColumnTypedResultsWithColumnIndex(
    sql: string,
    args: string[],
    columnIndex = 0,
    limit?: number,
  ): any[] {
    const resultSet = this.db.query(sql, args);
    const value = ResultUtils.buildSingleColumnResultsWithColumnIndex(
      new ResultSetResult(resultSet),
      columnIndex,
      limit,
    );
    resultSet.close();
    return value;
  }

  /**
   * Updates a row
   */
  public update(row: TRow): number {
    const contentValues = row.toContentValues();
    let updated = 0;
    if (contentValues.size() > 0) {
      updated = SQLUtils.update(
        this.getDb(),
        this.getTableName(),
        contentValues,
        this.getPkWhere(row.getId()),
        this.getPkWhereArgs(row.getId()),
      );
    }
    return updated;
  }

  /**
   * Update all rows matching the where clause with the provided values
   *
   * @param values content values
   * @param whereClause where clause
   * @param whereArgs where arguments
   * @return updated count
   */
  public updateWithContentValues(values: ContentValues, whereClause?: string, whereArgs?: []): number {
    return SQLUtils.update(this.getDb(), this.getTableName(), values, whereClause, whereArgs);
  }

  public create(row: TRow): number {
    return this.insert(row);
  }

  /**
   * {@inheritDoc}
   */
  public insert(row: TRow): number {
    const id = this.insertWithContentValues(row.toContentValues(false));
    if (row.hasIdColumn()) {
      row.setId(id, true);
    }
    return id;
  }

  /**
   * Inserts a new row
   *
   * @param values
   *            content values
   * @return row id, -1 on error
   */
  public insertWithContentValues(values: ContentValues): number {
    return SQLUtils.insert(this.getDb(), this.getTableName(), values);
  }

  /**
   * Inserts a new row
   *
   * @param values
   *            content values
   * @return row id
   */
  public insertOrThrow(values: ContentValues): number {
    return SQLUtils.insertOrThrow(this.getDb(), this.getTableName(), values);
  }

  /**
   * Get the min result of the column
   * @param column  column name
   * @param where  where clause
   * @param args where arugments
   * @return min or null
   */
  public min(column: string, where?: string, args?: any): number {
    return this.db.min(this.getTableName(), column, where, args);
  }

  /**
   * Get the max result of the column
   * @param column  column name
   * @param where  where clause
   * @param args where arugments
   * @return max or null
   */
  public max(column: string, where?: string, args?: any): number {
    return this.db.max(this.getTableName(), column, where, args);
  }

  /**
   * Query for the row where all fields match their values
   * @param fieldValues field values
   * @return result
   */
  public queryForFieldValues(fieldValues: FieldValues): TResult {
    return this.queryForFieldValuesWithDistinctAndColumns(undefined, undefined, fieldValues);
  }

  /**
   * Query for the row where all fields match their values
   * @param distinct distinct rows
   * @param fieldValues field values
   * @return result
   */
  public queryForFieldValuesWithDistinct(distinct = false, fieldValues: FieldValues): TResult {
    return this.queryForFieldValuesWithDistinctAndColumns(distinct, undefined, fieldValues);
  }

  /**
   * Query for the row where all fields match their values
   * @param columns columns
   * @param fieldValues field values
   * @return result
   */
  public queryForFieldValuesWithColumns(
    columns: string[] = this.table.getColumnNames(),
    fieldValues: FieldValues,
  ): TResult {
    return this.queryForFieldValuesWithDistinctAndColumns(undefined, columns, fieldValues);
  }

  /**
   * Query for the row where all fields match their values
   * @param distinct distinct rows
   * @param columns columns
   * @param fieldValues field values
   * @return result
   */
  public queryForFieldValuesWithDistinctAndColumns(
    distinct = false,
    columns: string[] = this.table.getColumnNames(),
    fieldValues: FieldValues,
  ): TResult {
    const where = this.buildWhereWithFields(fieldValues);
    const whereArgs = this.buildWhereArgs(fieldValues);
    const result = this.userDb.query(distinct, SQLUtils.quoteWrap(this.getTableName()), columns, where, whereArgs);
    this.prepareResult(result);
    return result;
  }

  /**
   * Query for the rows that are like the column
   * @return result
   * @param field
   * @param value
   */
  public queryForLike(field: string, value: any): TResult {
    const where = this.buildWhereLike(field, value);
    const whereArgs = this.buildWhereArgs(value);
    const result = this.userDb.query(
      false,
      SQLUtils.quoteWrap(this.getTableName()),
      this.table.getColumnNames(),
      where,
      whereArgs,
    );
    this.prepareResult(result);
    return result;
  }

  /**
   * Query for the row where all fields match their values
   * @param property property name
   * @param value property value
   * @param groupBy
   * @param having
   * @param orderBy
   * @return result
   */
  public queryForEq(property: string, value: any, groupBy?: string, having?: string, orderBy?: string): TResult {
    return this.queryForEqWithDistinctAndColumns(undefined, undefined, property, value, groupBy, having, orderBy);
  }

  /**
   * Query for the row where all fields match their values
   * @param distinct distinct rows
   * @param property property name
   * @param value property value
   * @param groupBy
   * @param having
   * @param orderBy
   * @return result
   */
  public queryForEqWithDistinct(
    distinct = false,
    property: string,
    value: any,
    groupBy?: string,
    having?: string,
    orderBy?: string,
  ): TResult {
    return this.queryForEqWithDistinctAndColumns(distinct, undefined, property, value, groupBy, having, orderBy);
  }

  /**
   * Query for the row where all fields match their values
   * @param columns columns
   * @param property property name
   * @param value property value
   * @param groupBy
   * @param having
   * @param orderBy
   * @return result
   */
  public queryForEqWithColumns(
    columns: string[] = this.table.getColumnNames(),
    property: string,
    value: any,
    groupBy?: string,
    having?: string,
    orderBy?: string,
  ): TResult {
    return this.queryForEqWithDistinctAndColumns(undefined, columns, property, value, groupBy, having, orderBy);
  }

  /**
   * Query for the row where the field equals the value
   * @param distinct
   * @param columns
   * @param fieldName
   * @param value
   * @param groupBy
   * @param having
   * @param orderBy
   */
  public queryForEqWithDistinctAndColumns(
    distinct = false,
    columns: string[] = this.table.getColumnNames(),
    fieldName: string,
    value: any,
    groupBy?: string,
    having?: string,
    orderBy?: string,
  ): TResult {
    const where = this.buildWhere(fieldName, value);
    const whereArgs = this.buildWhereArgs(value);
    const result = this.userDb.query(
      distinct,
      SQLUtils.quoteWrap(this.getTableName()),
      columns,
      where,
      whereArgs,
      undefined,
      groupBy,
      having,
      orderBy,
    );
    this.prepareResult(result);
    return result;
  }

  /**
   * Checks if the table exists
   */
  isTableExists(): boolean {
    return this.db.isTableExists(this.table.getTableName());
  }
}
