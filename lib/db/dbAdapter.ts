import { ResultSet } from './resultSet';

export type DBValue = boolean | string | number | Buffer | Uint8Array;

export interface DBAdapter {
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
  get(sql: string, params?: [] | Record<string, any>): Record<string, any>;
  isTableExists(tableName: string): boolean;
  all(sql: string, params?: [] | Record<string, any> | null): Record<string, any>[];
  each(sql: string, params?: [] | Record<string, any>): IterableIterator<Record<string, DBValue>>;
  run(sql: string, params?: [] | Record<string, any>): { changes: number; lastInsertRowid: number };
  insert(sql: string, params?: [] | Record<string, any>): number;
  prepareStatement(sql: string): any;
  bindAndInsert(statement: any, params?: [] | Record<string, any>): number;
  closeStatement(statement: any): void;
  delete(sql: string, params?: [] | Record<string, any>): number;
  dropTable(table: string): boolean;
  count(tableName: string, where?: string, whereArgs?: [] | Record<string, any>): number;
  transaction(func: Function): void;
  size(): number;
  readableSize(): string;
  query(sql: string, params: [] | Record<string, any>): ResultSet;
}
