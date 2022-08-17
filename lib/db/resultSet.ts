import { DBValue } from './dbAdapter';

/**
 * Wrapper for Database Results
 */
export class ResultSet {
  position: number;
  results: Record<string, DBValue>[];
  lastValueRetrieved: any;
  /**
   * Constructor
   * @param results
   */
  constructor(results: Record<string, DBValue>[]) {
    this.results = results;
    this.position = -1;
  }

  /**
   * Get results
   */
  public getResults(): Record<string, DBValue>[] {
    return this.results;
  }

  /**
   * Get count of results
   */
  public getCount(): number {
    return this.results.length;
  }

  /**
   * Get position in ResultSet
   */
  public getPosition(): number {
    return this.position;
  }

  /**
   * Get value for column
   * @param columnName
   */
  public getValue(columnName: string): DBValue {
    const record = this.results[this.position];
    this.lastValueRetrieved = record[columnName];
    return record[columnName];
  }

  /**
   * Move position to next position
   */
  public next(): boolean {
    this.position++;
    return this.position < this.results.length;
  }

  /**
   * Move to first entry in result
   */
  public moveToFirst(): boolean {
    return this.moveToPosition(0);
  }

  /**
   * Move to a specific position
   * @param position
   */
  public moveToPosition(position: number): boolean {
    this.position = position;
    return this.position >= 0 && this.position < this.results.length;
  }

  /**
   * Get column count
   */
  public getColumnCount(): number {
    return this.results.length > 0 ? Object.keys(this.results[0]).length : 0;
  }

  /**
   * Get column count
   */
  public getColumnNames(): string[] {
    return this.results.length > 0 ? Object.keys(this.results[0]) : [];
  }

  /**
   * Was the last value retrieved null
   */
  public wasNull(): boolean {
    return this.lastValueRetrieved === null;
  }

  /**
   * Get Buffer value for column name at current position
   * @param columnName
   */
  public getBuffer(columnName: string): Buffer {
    let buffer: Buffer = null;
    const value: DBValue = this.results[this.position][columnName];
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
    const value: DBValue = this.results[this.position][columnName];
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
    const value: DBValue = this.results[this.position][columnName];
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
    const result = this.results[this.position];
    const keys = Object.keys(result);
    if (index < keys.length) {
      const value: DBValue = this.results[this.position][keys[index]];
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
    const value: DBValue = this.results[this.position][columnName];
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
}
