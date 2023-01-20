import { Db } from './db';
import { GeoPackageConstants } from '../geoPackageConstants';
import { SQLiteMaster } from './master/sqliteMaster';
import { SQLiteMasterType } from './master/sqliteMasterType';
import { TableInfo } from './table/tableInfo';
import { SQLiteMasterQuery } from './master/sqliteMasterQuery';
import { SQLiteMasterColumn } from './master/sqliteMasterColumn';
import { SQLUtils } from './sqlUtils';
import type { ResultSet } from './resultSet';
import type { DBAdapter } from './dbAdapter';
import { GeoPackageDataType } from './geoPackageDataType';

/**
 * Represents a connection to the GeoPackage database
 */
export class GeoPackageConnection {
  connectionSource: DBAdapter;
  registeredFunctions: string[];
  /**
   * Construct a new connection to the GeoPackage SQLite file
   * @param connection the database adapter
   */
  constructor(connection: DBAdapter) {
    this.registeredFunctions = [];
    this.connectionSource = connection;
  }

  getConnectionSource(): DBAdapter {
    return this.connectionSource;
  }

  transaction(func: Function): void {
    this.connectionSource.transaction(func);
  }

  size(): number {
    return this.connectionSource.size();
  }

  readableSize(): string {
    return this.connectionSource.readableSize();
  }

  /**
   * Close the database.
   */
  close(): void {
    this.connectionSource.close();
  }
  /**
   * exports the GeoPackage as a file
   * @param  {Function} callback called with an err and the buffer containing the contents of the file
   */
  async export(): Promise<Uint8Array> {
    return this.connectionSource.export();
  }
  /**
   * Gets the raw connection to the database
   * @return {any}
   */
  getDBConnection(): any {
    return this.connectionSource.db;
  }
  /**
   * Connects to a GeoPackage database
   * @param  {any} db database to connect to
   */
  setDBConnection(db: any): void {
    this.connectionSource = Db.create();
    this.connectionSource.db = db;
  }
  /**
   * Registers the given function so that it can be used by SQL statements
   * @param  {string} name name of function to register
   * @param  {Function} functionDefinition function to register
   * @return {DBAdapter} the connection in use
   */
  registerFunction(name: string, functionDefinition: Function): DBAdapter {
    if (this.registeredFunctions.indexOf(name) === -1) {
      this.registeredFunctions.push(name);
      this.connectionSource.registerFunction(name, functionDefinition);
    }
    return this.connectionSource;
  }
  /**
   * Gets the first result from the query
   * @param  {string} sql sql query to run
   * @param  {Array|Object} [params] array of substitution parameters
   * @return {any}
   */
  get(sql: string, params?: [] | Record<string, any>): Record<string, any> {
    return this.connectionSource.get(sql, params);
  }
  /**
   * Gets the first result from the query
   * @param  {string} sql    sql query to run
   * @param  {Array|Object} [params] array of substitution parameters
   * @return {any}
   */
  query(sql: string, params?: [] | Record<string, any>): ResultSet {
    return this.connectionSource.query(sql, params);
  }


  /**
   * Queries for a single result
   * @param sql
   * @param args
   * @param column
   */
  public querySingleResult(sql: string, args?: string[], column?: number): any {
    return SQLUtils.querySingleResultWithColumnIndex(this, sql, args, column);
  }

  /**
   * Query results and return array
   * @param sql
   * @param args
   * @param limit
   */
  public queryResults(sql: string, args?: String[], limit?: number) {
    return SQLUtils.queryResults(this.connectionSource, sql, args, limit);
  }

  /**
   * Gets the first result from the query
   * @param  {string} sql    sql query to run
   * @param  {Array|Object} [params] array of substitution parameters
   * @return {any}
   */
  queryTypedResults(sql: string, params?: [] | Record<string, any>): ResultSet {
    return this.connectionSource.query(sql, params);
  }
  /**
   * Checks if table exists in database
   * @param {string} tableName
   * @returns {Boolean}
   */
  isTableExists(tableName: string): boolean {
    return this.connectionSource.isTableExists(tableName);
  }
  /**
   * Run the given SQL and return the results.
   * @param  {string} sql    sql to run
   * @param  {Array|Object} [params] array of substitution parameters
   * @return {{changes: number, lastInsertRowid: number}} object: `{ "changes": number, "lastInsertROWID": number }`
   * * `changes`: number of rows the statement changed
   * * `lastInsertROWID`: ID of the last inserted row
   */
  run(sql: string, params?: Record<string, any> | []): { changes: number; lastInsertRowid: number } {
    return this.connectionSource.run(sql, params);
  }
  /**
   * Executes the query and returns all results in an array
   * @param  {string} sql sql to run
   * @param  {Array|Object} [params] substitution parameters
   * @return {any[]}
   */
  all(sql: string, params?: [] | Record<string, any> | null): any[] {
    return this.connectionSource.all(sql, params);
  }
  /**
   * Executes the query and returns an Iterable object of results
   * @param  {string} sql    sql to run
   * @param  {Array|Object} [params] substitution parameters
   * @return {IterableIterator<Object>}
   */
  each(sql: string, params?: [] | Record<string, any>): IterableIterator<any> {
    return this.connectionSource.each(sql, params);
  }
  /**
   * Gets the minimum value from the column
   * @param  {string} table     table to query
   * @param  {string} column    column to get the min value from
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {number}
   */
  minOfColumn(table: string, column: string, where?: string, whereArgs?: [] | Record<string, any>): number {
    let minStatement = 'select min(' + column + ') as min from ' + table;
    if (where) {
      minStatement += ' ';
      if (where.indexOf('where')) {
        where = 'where ' + where;
      }
      minStatement += where;
    }
    return this.connectionSource.get(minStatement, whereArgs).min as number;
  }
  /**
   * Gets the maximum value from the column
   * @param  {string} table     table to query
   * @param  {string} column    column to get the max value from
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {number}
   */
  maxOfColumn(table: string, column: string, where?: string, whereArgs?: [] | Record<string, any>): number {
    let maxStatement = 'select max(' + column + ') as max from ' + table;
    if (where) {
      maxStatement += ' ';
      if (where.indexOf('where')) {
        where = 'where ' + where;
      }
      maxStatement += where;
    }
    return this.connectionSource.get(maxStatement, whereArgs).max as number;
  }
  /**
   * Return the count of objects in the table
   * @param  {string} table table name
   * @param  {string} [where] where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {number}
   */
  count(table: string, where?: string, whereArgs?: [] | Record<string, any>): number {
    return this.connectionSource.count(table, where, whereArgs);
  }

  /**
   * Get a count of results
   * @param table
   * @param distinct
   * @param column
   * @param where
   * @param whereArgs
   */
  countColumn(table: string, distinct = false, column?: string, where?: string, whereArgs?: [] | Record<string, any>): number {
    return this.aggregateFunction('COUNT', table, distinct, column, where, whereArgs);
  }
  /**
   * Executes an insert statement and returns the last id inserted
   * @param  {string} sql    sql to insert
   * @param  {Array|Object} params substitution parameters
   * @return {Object} last row id inserted
   */
  insert(sql: string, params: [] | Record<string, any>): number {
    return this.connectionSource.insert(sql, params);
  }
  /**
   * Delete from the table
   * @param  {string} tableName table name to delete from
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {number} number of rows deleted
   */
  delete(tableName: string, where?: string, whereArgs?: [] | Record<string, any>): number {
    let deleteStatement = 'DELETE FROM ' + SQLUtils.quoteWrap(tableName) + '';
    if (where) {
      deleteStatement += ' WHERE ' + where;
    }
    return this.connectionSource.delete(deleteStatement, whereArgs);
  }

  /**
   * Drops the table specified
   * @param  {string} tableName table to drop
   * @return {Boolean} results of table drop
   */
  dropTable(tableName: string): boolean {
    return this.connectionSource.dropTable(tableName);
  }

  /**
   * Check if the table exists
   *
   * @param tableName
   *            table name
   * @return true if exists
   */
  public tableExists(tableName: string): boolean {
    return SQLiteMaster.count(this, [SQLiteMasterType.TABLE], SQLiteMasterQuery.createForColumnValue(SQLiteMasterColumn.TBL_NAME, tableName)) > 0;
  }

  /**
   * Check if the view exists
   * @param viewName view name
   * @return true if exists
   */
  public viewExists(viewName: string): boolean {
    return SQLiteMaster.count(this, [SQLiteMasterType.VIEW], SQLiteMasterQuery.createForColumnValue(SQLiteMasterColumn.TBL_NAME, viewName)) > 0;
  }

  /**
   * Check if a table or view exists with the name
   * @param name table or view name
   * @return true if exists
   */
  public tableOrViewExists(name: string): boolean {
    return SQLiteMaster.count(this, [SQLiteMasterType.TABLE, SQLiteMasterType.VIEW], SQLiteMasterQuery.createForColumnValue(SQLiteMasterColumn.TBL_NAME, name)) > 0;
  }

  /**
   * Check if the table column exists
   *
   * @param tableName table name
   * @param columnName column name
   * @return true if column exists
   */
  public columnExists(tableName: string, columnName: string): boolean {
    let exists = false;
    const tableInfo = TableInfo.info(this, tableName);
    if (tableInfo != null) {
      exists = tableInfo.hasColumn(columnName);
    }
    return exists;
  }

  /**
   * Sets the APPLICATION_ID and user_version for GeoPackage
   */
  setApplicationId(): void {
    const buff = Buffer.from(GeoPackageConstants.APPLICATION_ID);
    const applicationId = buff.readUInt32BE(0);
    this.connectionSource.run('PRAGMA application_id = ' + applicationId);
  }

  setUserVersion(): void {
    this.connectionSource.run('PRAGMA user_version = ' + GeoPackageConstants.USER_VERSION);
  }
  /**
   * gets the application_id from the sqlite file
   * @return {number}
   */
  getApplicationId(): string {
    return this.connectionSource.get('PRAGMA application_id').application_id;
  }


  /**
   * Query for the foreign keys value
   *
   * @return true if enabled, false if disabled
   */
  public foreignKeys(): boolean {
    return SQLUtils.foreignKeys(this);
  }

  /**
   * Change the foreign keys state
   *
   * @param on
   *            true to turn on, false to turn off
   * @return previous foreign keys value
   */
  public setForeignKeys(on: boolean) {
    return SQLUtils.setForeignKeys(this, on);
  }

  /**
   * Perform a foreign key check
   *
   * @return empty list if valid or violation errors, 4 column values for each
   *         violation. see SQLite PRAGMA foreign_key_check
   */
  public foreignKeyCheck(): any[] {
    return SQLUtils.foreignKeyCheck(this);
  }

  /**
   * Perform a foreign key check
   *
   * @param tableName
   *            table name
   * @return empty list if valid or violation errors, 4 column values for each
   *         violation. see SQLite PRAGMA foreign_key_check
   */
  public foreignKeyCheckForTable(tableName: string): any[] {
    return SQLUtils.foreignKeyCheckForTable(this, tableName);
  }

  /**
   * Execute an aggregate function
   * @param func aggregate function
   * @param table able name
   * @param distinct distinct column flag
   * @param column column name
   * @param where where clause
   * @param args arguments
   * @return value or null
   */
  public aggregateFunction(func: string, table: string, distinct: boolean, column: string, where: string, args: any[] | Record<string, any>): any {
    const query = [];
    query.push("SELECT ");
    query.push(func);
    query.push("(");
    if (column != null) {
      if (distinct) {
        query.push("DISTINCT ");
      }
      query.push(SQLUtils.quoteWrap(column));
    } else {
      query.push("*");
    }
    query.push(") FROM ");
    query.push(SQLUtils.quoteWrap(table));
    if (where != null) {
      query.push(" WHERE ");
      query.push(where);
    }
    const sql = query.join('');
    return SQLUtils.querySingleResultWithColumnIndex(this, sql, args, 0);
  }

 /**
  * Get the min result of the column
  * @param table table name
  * @param column column name
  * @param where where clause
  * @param args where arguments
  * @return min or null
  */
    public min(table: string, column: string, where: string, args: any[]): number {
    return this.aggregateFunction('MIN', table, false, column, where, args) as number;
  }
  /**
   * Get the max result of the column
   * @param table table name
   * @param column column name
   * @param where where clause
   * @param args where arguments
   * @return max or null
   */
  public max(table: string, column: string, where: string, args: any[]): number {
    return this.aggregateFunction('MAX', table, false, column, where, args) as number;
  }
}
