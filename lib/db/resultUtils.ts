import { Result } from './result';

/**
 * Database Result utilities
 */
export class ResultUtils {
  /**
   * Get the value from the cursor from the provided column
   *
   * @param result result
   * @param columnName columnName
   * @return value value
   */
  public static getValue(result: Result, columnName: string): any {
    return result.getValue(columnName);
  }

  /**
   * Build single result value from the column
   *
   * @param result result
   * @param columnName column name
   * @return value
   */
  public static buildSingleResult(result: Result, columnName: string): any {
    let value = null;
    if (result.moveToNext()) {
      value = result.getValue(columnName);
    }
    return value;
  }

  /**
   * Build single result value from the column
   *
   * @param result result
   * @param columnIdx column index
   * @return value
   */
  public static buildSingleResultWithColumnIndex(result: Result, columnIdx: number): any {
    let value = null;
    if (result.moveToNext()) {
      value = result.getValueWithIndex(columnIdx);
    }
    return value;
  }

  /**
   * Build single column result rows from the result and the optional limit
   *
   * @param result  result
   * @param columnName column name
   * @param limit  result row limit
   * @return single column results
   */
  public static buildSingleColumnResults(result: Result, columnName: string, limit?: number): unknown[] {
    const results = [];
    while (result.moveToNext()) {
      const value = result.getValue(columnName);
      results.push(value);
      if (limit != null && results.length >= limit) {
        break;
      }
    }
    return results;
  }

  /**
   * Build single column result rows from the result and the optional limit
   *
   * @param result  result
   * @param columnIndex column name
   * @param limit  result row limit
   * @return single column results
   */
  public static buildSingleColumnResultsWithColumnIndex(result: Result, columnIndex = 0, limit?: number): unknown[] {
    const results = [];
    while (result.moveToNext()) {
      const value = result.getValueWithIndex(columnIndex);
      results.push(value);
      if (limit != null && results.length >= limit) {
        break;
      }
    }
    return results;
  }

  /**
   * Build the result rows from the result and the optional limit
   *
   * @param result result
   * @param limit result row limit
   * @return results
   */
  public static buildResults(result: Result, limit: number): unknown[][] {
    const results = [];
    let columns = null;
    while (result.moveToNext()) {
      if (columns == null) {
        columns = result.getColumnNames();
      }
      const row = [];
      for (const column of columns) {
        row.push(result.getValue(column));
      }
      results.push(row);
      if (limit != null && results.length >= limit) {
        break;
      }
    }

    return results;
  }
}
