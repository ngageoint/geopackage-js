import { Result } from './result';
import { ResultSetResult } from './resultSetResult';

/**
 * Database Result utilities
 */
export class ResultUtils {
  /**
   * Get the value from the cursor from the provided column
   * @param result result
   * @param columnName columnName
   * @return value value
   */
  public static getValue(result: Result, columnName: string): any {
    return result.getValue(columnName);
  }

  /**
   * Build single result value from the column
   * @param result result
   * @param columnName column name
   * @return value
   */
  public static buildSingleResult(result: ResultSetResult, columnName: string): any {
    let value = null;
    if (result.moveToNext()) {
      if (columnName != null) {
        value = result.getValue(columnName);
      } else {
        value = result.getValueWithIndex(0);
      }
    }
    return value;
  }

  /**
   * Build single result value from the column
   * @param result result
   * @param columnIdx column index
   * @return value
   */
  public static buildSingleResultWithColumnIndex(result: ResultSetResult, columnIdx: number): any {
    let value = null;
    if (result.moveToNext()) {
      value = result.getValueWithIndex(columnIdx);
    }
    return value;
  }

  /**
   * Build single column result rows from the result and the optional limit
   * @param result  result
   * @param columnName column name
   * @param limit  result row limit
   * @return single column results
   */
  public static buildSingleColumnResults(result: ResultSetResult, columnName: string, limit?: number): any[] {
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
   * @param result  result
   * @param columnIndex column name
   * @param limit  result row limit
   * @return single column results
   */
  public static buildSingleColumnResultsWithColumnIndex(
    result: ResultSetResult,
    columnIndex = 0,
    limit?: number,
  ): any[] {
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
   * @param result result
   * @param limit result row limit
   * @return results
   */
  public static buildResults(result: ResultSetResult, limit: number): any[][] {
    const results = [];
    let columns = null;
    while (result.moveToNext()) {
      if (columns == null) {
        columns = result.getColumnNames();
      }
      const row = [];
      for (let i = 0; i < columns; i++) {
        row.push(result.getValue(columns[i]));
      }
      results.push(row);
      if (limit != null && results.length >= limit) {
        break;
      }
    }
    return results;
  }
}
