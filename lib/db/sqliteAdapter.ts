import { DBAdapter } from './dbAdapter';
import { DBValue } from '../db/dbValue';
import fs from 'fs';
import path from 'path';
import http from 'http';
import os from 'os';
import { GeoPackageUtilities } from '../io/geoPackageUtilities';
import { ResultSet } from './resultSet';

/**
 * This adapter uses better-sqlite3 to execute queries against the GeoPackage database
 * @see {@link https://github.com/JoshuaWise/better-sqlite3|better-sqlite3}
 */
export class SqliteAdapter implements DBAdapter {
  filePath: string | Buffer | Uint8Array;
  db: any;

  /**
   * Returns a Promise which, when resolved, returns a DBAdapter which has connected to the GeoPackage database file
   */
  async initialize(): Promise<this> {
    // @ts-ignore
    try {
      const Database = require('better-sqlite3');
      if (this.filePath && typeof this.filePath === 'string') {
        if (this.filePath.indexOf('http') === 0) {
          const url: string = this.filePath as string;
          return new Promise((resolve, reject) => {
            http
              .get(url, response => {
                if (response.statusCode !== 200) {
                  reject(new Error('Unable to reach url: ' + this.filePath));
                }
                const tmpPath = path.join(os.tmpdir(), Date.now() + Math.floor(Math.random() * 100) + '.gpkg');
                const writeStream = fs.createWriteStream(tmpPath);
                response.pipe(writeStream);
                writeStream.on('close', () => {
                  try {
                    this.db = new Database(tmpPath);
                    // verify that this is an actual database
                    this.db.pragma('journal_mode = WAL');
                    this.filePath = tmpPath;
                    resolve(this);
                  } catch (err) {
                    reject(err);
                  }
                });
              })
              .on('error', e => {
                reject(e);
              });
          });
        } else {
          this.db = new Database(this.filePath);
          return this;
        }
      } else if (this.filePath) {
        // write this byte array to a file then open it
        const byteArray = this.filePath;
        const tmpPath = path.join(os.tmpdir(), Date.now() + '.gpkg');
        return new Promise((resolve, reject) => {
          fs.writeFile(tmpPath, byteArray, () => {
            this.db = new Database(tmpPath);
            // verify that this is an actual database
            try {
              this.db.pragma('journal_mode = WAL');
            } catch (err) {
              reject(err);
            }
            this.filePath = tmpPath;
            resolve(this);
          });
        });
      } else {
        console.log('create in memory');
        this.db = new Database(':memory:');
        return this;
      }
    } catch (err) {
      console.log('Error opening database', err);
      throw err;
    }
  }

  /**
   *
   * @param filePath
   */
  constructor(filePath?: string | Buffer | Uint8Array) {
    this.filePath = filePath;
  }

  /**
   * Returns the size in bytes
   */
  public size(): number {
    if (typeof this.filePath === 'string') {
      const stats = fs.statSync(this.filePath);
      return stats.size;
    }
  }

  /**
   * Returns the size in bytes
   */
  public readableSize(): string {
    if (typeof this.filePath === 'string') {
      const stats = fs.statSync(this.filePath);
      return GeoPackageUtilities.formatBytes(stats.size);
    }
  }

  /**
   * Closes the connection to the GeoPackage
   */
  close(): void {
    this.db.pragma('wal_autocheckpoint=0');
    this.db.pragma('wal_checkpoint(RESTART)');
    this.db.close();
  }
  /**
   * Get the connection to the database file
   * @return {*}
   */
  getDBConnection(): any {
    return this.db;
  }

  getFunctionList(): any[] {
    return this.db.pragma('function_list');
  }

  /**
   * Returns a Buffer containing the contents of the database as a file
   */
  async export(): Promise<Uint8Array> {
    return new Promise(resolve => {
      return fs.readFile(this.filePath as string, (err, data) => {
        resolve(data);
      });
    });
  }
  /**
   * Registers the given function so that it can be used by SQL statements
   * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#registeroptions-function---this|better-sqlite3 register}
   * @param  {string} name               name of function to register
   * @param  {Function} functionDefinition function to register
   * @return {Adapter} this
   */
  registerFunction(name: string, functionDefinition: Function): this {
    this.db.function(name, functionDefinition);
    return this;
  }
  /**
   * Gets one row of results from the statement
   * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#getbindparameters---row|better-sqlite3 get}
   * @param  {string} sql    statement to run
   * @param  {Array|Object} [params] bind parameters
   * @return {Object}
   */
  get(sql: string, params?: [] | Record<string, DBValue>): Record<string, DBValue> {
    const statement = this.db.prepare(sql);
    if (params) {
      return statement.get(params);
    } else {
      return statement.get();
    }
  }
  /**
   * Determines if a tableName exists in the database
   * @param {String} tableName
   * @returns {Boolean}
   */
  isTableExists(tableName: string): boolean {
    let statement = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=:name");
    const result = statement.get({ name: tableName })
    statement = null;
    return !!result;
  }
  /**
   * Gets all results from the statement in an array
   * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#allbindparameters---array-of-rows|better-sqlite3 all}
   * @param  {String} sql    statement to run
   * @param  {Array|Object} [params] bind parameters
   * @return {Object[]}
   */
  all(sql: string, params?: [] | Record<string, DBValue>): Record<string, DBValue>[] {
    const statement = this.db.prepare(sql);
    if (params) {
      return statement.all(params);
    } else {
      return statement.all();
    }
  }
  /**
   * Returns an `Iterable` with results from the query
   * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#iteratebindparameters---iterator|better-sqlite3 iterate}
   * @param  {String} sql    statement to run
   * @param  {Object|Array} [params] bind parameters
   * @return {Iterable.<Object>}
   */
  each(sql: string, params?: [] | Record<string, DBValue>): IterableIterator<Record<string, DBValue>> {
    const statement = this.db.prepare(sql);
    if (params) {
      return statement.iterate(params);
    } else {
      return statement.iterate();
    }
  }
  /**
   * Run the given statement, returning information about what changed.
   *
   * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#runbindparameters---object|better-sqlite3}
   * @param  {String} sql    statement to run
   * @param  {Object|Array} [params] bind parameters
   * @return {{changes: number, lastInsertROWID: number}} object: `{ "changes": number, "lastInsertROWID": number }`
   * * `changes`: number of rows the statement changed
   * * `lastInsertROWID`: ID of the last inserted row
   */
  run(sql: string, params?: [] | Record<string, DBValue>): { changes: number; lastInsertRowid: number } {
    const statement = this.db.prepare(sql);
    if (params) {
      return statement.run(params);
    } else {
      return statement.run();
    }
  }
  /**
   * Runs the specified insert statement and returns the last inserted id or undefined if no insert happened
   * @param  {String} sql    statement to run
   * @param  {Object|Array} [params] bind parameters
   * @return {Number} last inserted row id
   */
  insert(sql: string, params?: [] | Record<string, DBValue>): number {
    const statement = this.db.prepare(sql);
    return statement.run(params).lastInsertRowid;
  }
  /**
   * Prepares a SQL statement
   * @param sql
   */
  prepareStatement (sql: string): any {
    return this.db.prepare(sql);
  }
  /**
   * Runs an insert statement with the parameters provided
   * @param  {any} statement  statement to run
   * @param  {Object|Array} [params] bind parameters
   * @return {Number} last inserted row id
   */
  bindAndInsert (statement: any, params?: [] | Record<string, DBValue>): number {
    return statement.run(params).lastInsertRowid;
  }
  /**
   * Closes a prepared statement
   * @param statement
   */
  closeStatement (statement: any) {
    statement = null;
  }
  /**
   * Runs the specified delete statement and returns the number of deleted rows
   * @param  {String} sql    statement to run
   * @param  {Object|Array} params bind parameters
   * @return {Number} deleted rows
   */
  delete(sql: string, params?: [] | Record<string, DBValue>): number {
    const statement = this.db.prepare(sql);
    if (params != null) {
      return statement.run(params).changes;
    } else {
      return statement.run().changes;
    }
  }
  /**
   * Drops the table
   * @param  {String} table table name
   * @return {Boolean} indicates if the table was dropped
   */
  dropTable(table: string): boolean {
    try {
      const statement = this.db.prepare('DROP TABLE IF EXISTS "' + table + '"');
      const result = statement.run();
      const vacuum = this.db.prepare('VACUUM');
      vacuum.run();
      return result.changes === 0;
    } catch (e) {
      console.error('Drop Table Error', e);
      return false;
    }
  }
  /**
   * Counts rows that match the query
   * @param  {string} tableName table name from which to count
   * @param  {string} [where]     where clause
   * @param  {Object|Array} [whereArgs] where args
   * @return {Number} count
   */
  count(tableName: string, where?: string, whereArgs?: [] | Record<string, DBValue>): number {
    let sql = 'SELECT COUNT(*) as count FROM "' + tableName + '"';
    if (where) {
      sql += ' where ' + where;
    }
    const statement = this.db.prepare(sql);
    if (whereArgs) {
      return statement.get(whereArgs).count;
    } else {
      return statement.get().count;
    }
  }

  transaction(func: Function): void {
    this.db.transaction(func)();
  }

  /**
   * Returns a result set for the given query
   */
  query(sql: string, params?: [] | Record<string, DBValue>): ResultSet {
    let statement = this.db.prepare(sql);
    let iterator;
    if (params) {
      iterator = statement.iterate(params);
    } else {
      iterator = statement.iterate();
    }
    const close = () => {
      try {
        if (iterator != null) {
          iterator.return();
          iterator = null;
        }
        statement = null;
      } catch (e) {
        console.error(e);
      }
    }
    return new ResultSet(iterator, { close }, this);
  }

  /**
   * Enable or disable unsafe mode
   * @param enabled
   */
  unsafe(enabled: boolean): void {
    this.db.unsafeMode(enabled);
  }
}
