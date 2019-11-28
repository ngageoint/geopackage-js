export default interface DBAdapter {
  db: any;
  filePath: String | Buffer | Uint8Array;
  /**
   * Returns a Promise which, when resolved, returns a DBAdapter which has connected to the GeoPackage database file
   */
  initialize(): Promise<this>;
  close(): void;
  getDBConnection(): any;
  export(callback: Function): void;
  registerFunction(name: String, functionDefinition: Function): this;
  get(sql: String, params?: [] | Object): any;
  isTableExists(tableName: String): Boolean;
  all(sql: String, params?: [] | Object): any[];
  each(sql: String, params?: [] | Object): IterableIterator<any>;
  run(sql: String, params?: [] | Object): {changes: number, lastInsertROWID: number};
  insert(sql: String, params?: [] | Object): Number;
  delete(sql: String, params?: [] | Object): Number;
  dropTable(table: String): Boolean;
  count(tableName: String, where?: String, whereArgs?: [] | Object): Number;
}