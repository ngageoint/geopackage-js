/**
 * Database result interface
 */
export interface Result {
  /**
   * Get the value for the column
   *
   * @param columnName
   * @return value
   */
  getValue(columnName: string): any;

  /**
   * Move the cursor to the next row.
   *
   * @return true if another row
   */
  moveToNext(): boolean;

  /**
   * Get the current position
   *
   * @return position
   */
  getPosition(): number;

  /**
   * Move the cursor to the first row.
   *
   * @return true if moved to first
   */
  moveToFirst(): boolean;

  /**
   * Move the cursor to an absolute position
   *
   * @param position
   *            position
   * @return true if moved to position
   */
  moveToPosition(position: number): boolean;

  /**
   * Get the number of columns
   *
   * @return column count
   */
  getColumnCount(): number;

  /**
   * Get the name of the columns
   *
   * @return column names
   */
  getColumnNames(): string[];

  /**
   * Returns the value of the requested column as a String.
   *
   * @param columnName column name
   * @return string value
   */
  getString(columnName: string): string;

  /**
   * Returns the value of the requested column as an int.
   *
   * @param columnName column name
   * @return int value
   */
  getNumber(columnName: string): number;

  /**
   * Returns the value of the requested column as a byte array.
   *
   * @param columnName column name
   * @return bytes value
   */
  getBuffer(columnName: string): Buffer;

  /**
   * Was the last value retrieved null
   *
   * @return true if was null
   */
  wasNull(): boolean;
}
