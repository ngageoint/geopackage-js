export default interface DBAdapter {
  db: any;
  filePath: string | Buffer | Uint8Array;
  /**
   * Returns a Promise which, when resolved, returns a DBAdapter which has connected to the GeoPackage database file
   */
  initialize(): Promise<this>;
  close(): void;
  getDBConnection(): any;
  export(): Promise<any>;
  registerFunction(name: string, functionDefinition: Function): this;
  get(sql: string, params?: [] | Object): any;
  isTableExists(tableName: string): Boolean;
  all(sql: string, params?: [] | Object | null): any[];
  each(sql: string, params?: [] | Object): IterableIterator<any>;
  run(sql: string, params?: [] | Object): {changes: number, lastInsertRowid: number};
  insert(sql: string, params?: [] | Object): number;
  delete(sql: string, params?: [] | Object): number;
  dropTable(table: string): Boolean;
  count(tableName: string, where?: string, whereArgs?: [] | Object): number;
}