import { SqliteAdapter } from './sqliteAdapter';
import { SqljsAdapter } from './sqljsAdapter';
import DBAdapter from './dbAdapter';

/**
 * Connection to the SQLite file
 * @module db/geoPackageConnection
 */

var GeoPackageConstants = require('../geoPackageConstants');

if (typeof(process) !== 'undefined' && process.version && !process.env.FORCE_SQLJS) {
  console.log('Better SQLite');
} else {
  console.log('SQL.js');
}

/**
 * Represents a connection to the GeoPackage database
 */
export default class GeoPackageConnection {
  filePath: string | Buffer | Uint8Array;
  adapter: DBAdapter;
  adapterCreator: typeof SqliteAdapter | typeof SqljsAdapter;
  /**
   * Construct a new connection to the GeoPackage SQLite file
   * @param filePath path to the sqlite file
   */
  constructor(filePath: string | Buffer | Uint8Array) {
    this.filePath = filePath;
  }
  /**
   * Creates a connection to the SQLite file and when connected, returns a promise that resolves the connection.
   * This will create a {module:db/sqliteAdapter~Adapter} if running in node and the FORCE_SQLJS environment variable is not set.
   * This will create a {module:db/sqljsAdapter~Adapter} if running in the browser or the FORCE_SQLJS environment variable is set
   * @return {Promise<GeoPackageConnection>}
   */
  async init(): Promise<GeoPackageConnection> {
    try {
      if (typeof (process) !== 'undefined' && process.version && !process.env.FORCE_SQLJS) {
        const { SqliteAdapter } = await import('./sqliteAdapter');
        this.adapterCreator = SqliteAdapter;
        this.adapter = new SqliteAdapter(this.filePath);
      }
      else {
        const { SqljsAdapter } = await import('./sqljsAdapter');
        this.adapterCreator = SqljsAdapter;
        this.adapter = new SqljsAdapter(this.filePath);
      }
      await this.adapter.initialize();
    } catch (e) {
      console.log('Failed to create adapter', e);
      throw e;
    }
    return this;
  }
  /**
   * Close the database.
   */
  close(): void {
    this.adapter.close();
  }
  /**
   * exports the GeoPackage as a file
   * @param  {Function} callback called with an err and the buffer containing the contents of the file
   */
  export(callback: Function): void {
    this.adapter.export(callback);
  }
  /**
   * Gets the raw connection to the database
   * @return {any}
   */
  getDBConnection(): any {
    return this.adapter.db;
  }
  /**
   * Connects to a GeoPackage database
   * @param  {any} db database to connect to
   */
  setDBConnection(db: any): void {
    this.adapter = new this.adapterCreator();
    this.adapter.db = db;
  }
  /**
  * Registers the given function so that it can be used by SQL statements
  * @param  {string} name               name of function to register
  * @param  {Function} functionDefinition function to register
  * @return {DBAdapter} the adapter in use
  */
  registerFunction(name: string, functionDefinition: Function): DBAdapter {
    this.adapter.registerFunction(name, functionDefinition);
    return this.adapter;
  }
  /**
   * Gets the first result from the query
   * @param  {string} sql    sql query to run
   * @param  {Array|Object} [params] array of substitution parameters
   * @return {any}
   */
  get(sql: string, params?: [] | Object): any {
    return this.adapter.get(sql, params);
  }
  /**
   * Checks if table exists in database
   * @param {string} tableName
   * @returns {Boolean}
   */
  isTableExists(tableName: string): Boolean {
    return this.adapter.isTableExists(tableName);
  }
  /**
   * Run the given SQL and return the results.
   * @param  {string} sql    sql to run
   * @param  {Array|Object} [params] array of substitution parameters
   * @return {{changes: number, lastInsertROWID: number}} object: `{ "changes": number, "lastInsertROWID": number }`
   * * `changes`: number of rows the statement changed
   * * `lastInsertROWID`: ID of the last inserted row
   */
  run(sql: string, params?: Object | []): { changes: number; lastInsertROWID: number;} {
    return this.adapter.run(sql, params);
  }
  /**
   * Executes the query and returns all results in an array
   * @param  {string} sql sql to run
   * @param  {Array|Object} [params] substitution parameters
   * @return {any[]}
   */
  all(sql: string, params?: [] | Object): any[] {
    return this.adapter.all(sql, params);
  }
  /**
   * Executes the query and returns an Iterable object of results
   * @param  {string} sql    sql to run
   * @param  {Array|Object} [params] substitution parameters
   * @return {IterableIterator<Object>}
   */
  each(sql: string, params?: [] | Object): IterableIterator<any> {
    return this.adapter.each(sql, params);
  }
  /**
   * Gets the minimum value from the column
   * @param  {string} table     table to query
   * @param  {string} column    column to get the min value from
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {number}
   */
  minOfColumn(table: string, column: string, where?: string, whereArgs?: [] | Object): number {
    var minStatement = 'select min(' + column + ') as min from ' + table;
    if (where) {
      minStatement += ' ';
      if (where.indexOf('where')) {
        where = 'where ' + where;
      }
      minStatement += where;
    }
    return this.adapter.get(minStatement, whereArgs).min;
  }
  /**
   * Gets the maximum value from the column
   * @param  {string} table     table to query
   * @param  {string} column    column to get the max value from
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {number}
   */
  maxOfColumn(table: string, column: string, where?: string, whereArgs?: [] | Object): number {
    var maxStatement = 'select max(' + column + ') as max from ' + table;
    if (where) {
      maxStatement += ' ';
      if (where.indexOf('where')) {
        where = 'where ' + where;
      }
      maxStatement += where;
    }
    return this.adapter.get(maxStatement, whereArgs).max;
  }
  /**
   * Return the count of objects in the table
   * @param  {string} table table name
   * @param  {string} [where] where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {number}
   */
  count(table: string, where?: string, whereArgs?: [] | Object): number {
    return this.adapter.count(table, where, whereArgs);
  }
  /**
   * Executes an insert statement and returns the last id inserted
   * @param  {string} sql    sql to insert
   * @param  {Array|Object} params substitution parameters
   * @return {Object} last row id inserted
   */
  insert(sql: string, params: [] | Object): number {
    return this.adapter.insert(sql, params);
  }
  /**
   * Delete from the table
   * @param  {string} tableName table name to delete from
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] substitution parameters
   * @return {number} number of rows deleted
   */
  delete(tableName: string, where?: string, whereArgs?: [] | Object): number {
    var deleteStatement = 'DELETE FROM ' + tableName + '';
    if (where) {
      deleteStatement += ' WHERE ' + where;
    }
    return this.adapter.delete(deleteStatement, whereArgs);
  }
  /**
   * Drops the table specified
   * @param  {string} tableName table to drop
   * @return {Boolean} results of table drop
   */
  dropTable(tableName: string): Boolean {
    return this.adapter.dropTable(tableName);
  }
  /**
   * Gets information about the table specified.  If data is returned, the table exists
   * @param  {string} tableName table to check
   * @return {Object}
   */
  tableExists(tableName: string): any {
    return this.adapter.get('SELECT name FROM sqlite_master WHERE type="table" AND name=?', [tableName]);
  }
  /**
   * Checks if a table and column exist
   * @param  {string} tableName  table to check
   * @param  {string} columnName column to check
   * @return {Boolean}
   */
  columnAndTableExists(tableName: string, columnName: string): Boolean {
    var columns = this.adapter.all('PRAGMA table_info(\'' + tableName + '\')');
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].name === columnName) {
        return true;
      }
    }
    return false;
  }
  /**
   * Sets the APPLICATION_ID and user_version for GeoPackage
   */
  setApplicationId(): void {
    var buff = Buffer.from(GeoPackageConstants.APPLICATION_ID);
    var applicationId = buff.readUInt32BE(0);
    this.adapter.run('PRAGMA application_id = ' + applicationId);
    this.adapter.run('PRAGMA user_version = ' + GeoPackageConstants.USER_VERSION);
  }
  /**
   * gets the application_id from the sqlite file
   * @return {number}
   */
  getApplicationId(): number {
    return this.adapter.get('PRAGMA application_id').application_id;
  }
  /**
   * Convenience method
   * @see {module:db/geoPackageConnection~GeoPackageConnection}
   * @see {module:db/sqliteAdapter~Adapter}
   * @see {module:db/sqljsAdapter~Adapter}
   * @param  {string|Buffer|Uint8Array} filePath string path to an existing file or a path to where a new file will be created or a Buffer containing the contents of the file, if undefined, an in memory database is created
   * @return {Promise} that resolves
   */
  static connect(filePath: string | Buffer | Uint8Array) : Promise<GeoPackageConnection> {
    return new GeoPackageConnection(filePath).init();
  }
  /**
   * Convenience method
   * @param  {Object}   db       open database to connect to
   * @return {Promise}
   */
  static connectWithDatabase(db: any) {
    return new GeoPackageConnection(undefined).init()
      .then(function (connection: GeoPackageConnection) {
        connection.setDBConnection(db);
      });
  }
}