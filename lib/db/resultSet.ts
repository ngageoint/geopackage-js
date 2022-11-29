import { DBAdapter } from './dbAdapter';
import { Statement } from './statement';
import { DBValue } from './dbValue';

/**
 * Wrapper for Database Results
 */
export class ResultSet {
  /**
   * Iterable results from a query
   */
  results: IterableIterator<Record<string, DBValue>>;

  /**
   * Value stored after calling next
   */
  nextValue: any;

  /**
   * Track if result set has a next
   */
  hasNext = true;

  /**
   * Statement
   */
  statement: Statement;

  /**
   * Connection
   */
  readonly connection: DBAdapter;

  /**
   * Constructor
   * @param results
   * @param statement
   * @param connection
   */
  constructor(results: IterableIterator<Record<string, DBValue>>, statement: Statement, connection: DBAdapter) {
    this.results = results;
    this.statement = statement;
    this.connection = connection;
  }

  /**
   * Get value for column
   * @param columnName
   */
  public getValue(columnName: string): DBValue {
    const record = this.nextValue;
    return record[columnName];
  }

  /**
   * Get value for column
   * @param columnIndex
   */
  public getValueWithIndex(columnIndex: number): DBValue {
    const record = this.nextValue;
    const columnName = Object.keys(record)[columnIndex];
    return record[columnName];
  }

  /**
   * Move position to next position
   */
  public next(): boolean {
    if (this.hasNext) {
      const nextResult = this.results.next();
      this.nextValue = nextResult.value;
      this.hasNext = !nextResult.done;
    }
    return this.hasNext;
  }

  /**
   * Get column count
   */
  public getColumnCount(): number {
    return Object.keys(this.nextValue).length;
  }

  /**
   * Get column count
   */
  public getColumnNames(): string[] {
    return Object.keys(this.nextValue);
  }

  /**
   * Was the last value retrieved null
   */
  public wasNull(): boolean {
    return this.nextValue === null;
  }

  /**
   * Get Buffer value for column name at current position
   * @param columnName
   */
  public getBuffer(columnName: string): Buffer {
    let buffer: Buffer = null;
    const value: DBValue = this.nextValue[columnName];
    if (value != null) {
      if (value instanceof Buffer) {
        buffer = value;
      } else if (value instanceof Uint8Array) {
        buffer = Buffer.from(value);
      }
    }
    return buffer;
  }

  /**
   * Get Number value for column name at current position
   * @param columnName
   */
  public getNumber(columnName: string): number {
    let number: number = null;
    const value: DBValue = this.nextValue[columnName];
    if (value != null) {
      if (typeof value === 'number') {
        number = value;
      }
    }
    return number;
  }

  /**
   * Get string value for column name at current position
   * @param columnName
   */
  public getString(columnName: string): string {
    let str: string = null;
    const value: DBValue = this.nextValue[columnName];
    if (value != null) {
      if (typeof value === 'string') {
        str = value;
      }
    }
    return str;
  }

  /**
   * Get string value for index at the current position
   * @param index
   */
  public getStringAtIndex(index: number): string {
    let str: string = null;
    const result = this.nextValue;
    const keys = Object.keys(result);
    if (index < keys.length) {
      const value: DBValue = this.nextValue[keys[index]];
      if (value != null) {
        if (typeof value === 'string') {
          str = value;
        }
      }
    }
    return str;
  }

  /**
   * Get boolean value for column name at current position
   * @param columnName
   */
  public getBoolean(columnName: string): boolean {
    let bool: boolean = null;
    const value: DBValue = this.nextValue[columnName];
    if (value != null) {
      if (typeof value === 'boolean') {
        bool = value;
      } else if (typeof value === 'number') {
        bool = value === 1;
      } else if (typeof value === 'string') {
        bool = value === '1';
      }
    }
    return bool;
  }

  /**
   * Close the statement
   */
  close(): void {
    try {
      this.results = null;
      if (this.statement != null) {
        this.statement.close();
      }
    } catch (e) {
      console.error('failed to close');
    }
  }

  /**
   * Get the GeoPackageConnection for this result set
   */
  getConnection(): DBAdapter {
    return this.connection;
  }

  /**
   * Returns true if this result has a value after calling next
   */
  hasValue (): boolean {
    return this.nextValue != null;
  }
}
