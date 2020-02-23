import { DBAdapter, DBValue } from './dbAdapter';
/**
 * This adapter uses sql.js to execute queries against the GeoPackage database
 * @module db/sqljsAdapter
 * @see {@link http://kripken.github.io/sql.js/documentation/|sqljs}
 */
// @ts-ignore
import sqljs from 'rtree-sql.js/dist/sql-asm-memory-growth.js';
// var sqljs = require('sql.js/js/sql.js');

/**
 * Class which adapts generic GeoPackage queries to sqljs queries
 */
export class SqljsAdapter implements DBAdapter {
  db: any;
  filePath: string | Buffer | Uint8Array;
  /**
   * Returns a Promise which, when resolved, returns a DBAdapter which has connected to the GeoPackage database file
   */
  initialize(): Promise<this> {
    const promise = new Promise<this>((resolve, reject) => {
      sqljs().then((SQL: { Database: any }) => {
        if (this.filePath && typeof this.filePath === 'string') {
          if (typeof process !== 'undefined' && process.version) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const fs = require('fs');
            if (this.filePath.indexOf('http') === 0) {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const http = require('http');
              http
                .get(this.filePath, (response: any) => {
                  if (response.statusCode !== 200) {
                    return reject(new Error('Unable to reach url: ' + this.filePath));
                  }
                  const body: any = [];
                  response.on('data', (chunk: any) => body.push(chunk));
                  response.on('end', () => {
                    const t = new Uint8Array(Buffer.concat(body));
                    this.db = new SQL.Database(t);
                    resolve(this);
                  });
                })
                .on('error', (e: any) => {
                  return reject(e);
                });
            } else {
              try {
                fs.statSync(this.filePath);
              } catch (e) {
                this.db = new SQL.Database();
                // var adapter = new SqljsAdapter(db);
                return resolve(this);
              }
              const filebuffer = fs.readFileSync(this.filePath);
              const t = new Uint8Array(filebuffer);
              this.db = new SQL.Database(t);
              // console.log('setting wal mode');
              // var walMode = db.exec('PRAGMA journal_mode=DELETE');
              // console.log('walMode', walMode);
              // adapter = new SqljsAdapter(db);
              return resolve(this);
            }
          } else {
            // eslint-disable-next-line no-undef
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.filePath, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = (): void => {
              if (xhr.status !== 200) {
                return reject(new Error('Unable to reach url: ' + this.filePath));
              }
              const uInt8Array = new Uint8Array(xhr.response);
              this.db = new SQL.Database(uInt8Array);
              return resolve(this);
            };
            xhr.onerror = (): void => {
              return reject(new Error('Error reaching url: ' + this.filePath));
            };
            xhr.send();
          }
        } else if (this.filePath) {
          const byteArray = this.filePath;
          this.db = new SQL.Database(byteArray);
          return resolve(this);
        } else {
          this.db = new SQL.Database();
          return resolve(this);
        }
      });
    });

    return promise;
  }

  // /**
  //  * Creates an adapter from an already established better-sqlite3 database connection
  //  * @param  {any} db sqljs database connection
  //  * @return {module:db/sqljsAdapter~Adapter}
  //  */
  // static createAdapterFromDb(db) {
  //   return new SqljsAdapter(db);
  // }
  /**
   * @param  {string|Buffer|Uint8Array} [filePath] string path to an existing file or a path to where a new file will be created or a url from which to download a GeoPackage or a Uint8Array containing the contents of the file, if undefined, an in memory database is created
   */
  constructor(filePath?: string | Buffer | Uint8Array) {
    this.filePath = filePath;
  }
  /**
   * Closes the connection to the GeoPackage
   */
  close(): void {
    this.db.close();
  }
  /**
   * Get the connection to the database file
   * @return {any}
   */
  getDBConnection(): any {
    return this.db;
  }
  /**
   * Returns a Uint8Array containing the contents of the database as a file
   */
  async export(): Promise<Uint8Array> {
    return this.db.export();
  }
  /**
   * Registers the given function so that it can be used by SQL statements
   * @see {@link http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Database.html#create_function-dynamic|sqljs create_function}
   * @param  {string} name               name of function to register
   * @param  {Function} functionDefinition function to register
   * @return {module:db/sqljsAdapter~Adapter} this
   */
  registerFunction(name: string, functionDefinition: Function): this {
    this.db.create_function(name, functionDefinition);
    return this;
  }
  /**
   * Gets one row of results from the statement
   * @see {@link http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Statement.html#get-dynamic|sqljs get}
   * @see {@link http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Statement.html#getAsObject-dynamic|sqljs getAsObject}
   * @param  {String} sql    statement to run
   * @param  {Array|Object} [params] substitution parameters
   * @return {Object}
   */
  get(sql: string, params?: [] | Record<string, DBValue>): Record<string, DBValue> {
    params = params || [];
    const statement = this.db.prepare(sql);
    statement.bind(params);
    const hasResult = statement.step();
    let row;
    if (hasResult) {
      row = statement.getAsObject();
    }
    statement.free();
    return row;
  }
  /**
   * Determines if a tableName exists in the database
   * @param {String} tableName
   * @returns {Boolean}
   */
  isTableExists(tableName: string): boolean {
    const statement = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=:name");
    statement.bind([tableName]);
    const hasResult = statement.step();
    let row;
    if (hasResult) {
      row = statement.getAsObject();
    }
    statement.free();
    return !!row;
  }
  /**
   * Gets all results from the statement in an array
   * @param  {String} sql    statement to run
   * @param  {Array|Object} [params] bind parameters
   * @return {Object[]}
   */
  all(sql: string, params?: [] | Record<string, DBValue>): Record<string, DBValue>[] {
    const rows = [];
    const iterator = this.each(sql, params);
    for (const row of iterator) {
      rows.push(row);
    }
    return rows;
  }
  /**
   * Returns an Iterable with results from the query
   * @param  {string} sql    statement to run
   * @param  {Object|Array} params bind parameters
   * @return {IterableIterator<Object>}
   */
  each(sql: string, params?: [] | Record<string, DBValue>): IterableIterator<Record<string, DBValue>> {
    const statement = this.db.prepare(sql);
    statement.bind(params);
    return {
      [Symbol.iterator](): IterableIterator<Record<string, DBValue>> {
        return this;
      },
      next: function(): { value: Record<string, DBValue>; done: boolean } {
        if (statement.step()) {
          return {
            value: statement.getAsObject(),
            done: false,
          };
        } else {
          statement.free();
          return {
            value: undefined,
            done: true,
          };
        }
      },
    };
  }
  /**
   * Runs the statement specified, returning information about what changed
   * @see {@link http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Statement.html#run-dynamic|sqljs run}
   * @param  {string} sql    statement to run
   * @param  {Object|Array} [params] bind parameters
   * @return {Object} object containing a changes property indicating the number of rows changed and a lastInsertROWID indicating the last inserted row
   */
  run(sql: string, params?: [] | Record<string, DBValue>): { changes: number; lastInsertRowid: number } {
    if (params && !(params instanceof Array)) {
      for (const key in params) {
        params['$' + key] = params[key];
      }
    }
    this.db.run(sql, params);
    const lastId = this.db.exec('select last_insert_rowid();');
    let lastInsertedId;
    if (lastId) {
      lastInsertedId = lastId[0].values[0][0];
    }
    return {
      lastInsertRowid: lastInsertedId,
      changes: this.db.getRowsModified(),
    };
  }
  /**
   * Runs the specified insert statement and returns the last inserted id or undefined if no insert happened
   * @param  {String} sql    statement to run
   * @param  {Object|Array} [params] bind parameters
   * @return {Number} last inserted row id
   */
  insert(sql: string, params?: [] | Record<string, DBValue>): number {
    if (params && !(params instanceof Array)) {
      for (const key in params) {
        params['$' + key] = params[key];
      }
    }
    const statement = this.db.prepare(sql, params);
    statement.step();
    statement.free();
    const lastId = this.db.exec('select last_insert_rowid();');
    if (lastId) {
      return lastId[0].values[0][0];
    } else {
      return;
    }
  }
  /**
   * Runs the specified delete statement and returns the number of deleted rows
   * @param  {String} sql    statement to run
   * @param  {Object|Array} [params] bind parameters
   * @return {Number} deleted rows
   */
  delete(sql: string, params?: [] | Record<string, DBValue>): number {
    let rowsModified = 0;
    const statement = this.db.prepare(sql, params);
    statement.step();
    rowsModified = this.db.getRowsModified();
    statement.free();
    return rowsModified;
  }
  /**
   * Drops the table
   * @param  {String} table table name
   * @return {Boolean} indicates if the table was dropped
   */
  dropTable(table: string): boolean {
    const response = this.db.exec('DROP TABLE IF EXISTS "' + table + '"');
    this.db.exec('VACUUM');
    return !!response;
  }
  /**
   * Counts rows that match the query
   * @param  {String} tableName table name from which to count
   * @param  {String} [where]     where clause
   * @param  {Object|Array} [whereArgs] where args
   * @return {Number} count
   */
  count(tableName: string, where?: string, whereArgs?: [] | Record<string, DBValue>): number {
    let sql = 'SELECT COUNT(*) as count FROM "' + tableName + '"';
    if (where) {
      sql += ' where ' + where;
    }
    return this.get(sql, whereArgs).count as number;
  }
}
