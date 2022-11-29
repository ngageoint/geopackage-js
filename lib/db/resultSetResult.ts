import { Result } from './result';
import { ResultSet } from './resultSet';
import { GeoPackageException } from '../geoPackageException';
import { GeoPackageDataType } from './geoPackageDataType';

/**
 * Result Set result implementation.
 */
export class ResultSetResult implements Result {
  /**
   * Result Set
   */
  protected resultSet: ResultSet;

  /**
   * Constructor
   *
   * @param resultSet
   *            result set
   */
  public constructor(resultSet: ResultSet) {
    this.resultSet = resultSet;
  }

  /**
   * Get the Result Set
   *
   * @return result set
   */
  public getResultSet(): ResultSet {
    return this.resultSet;
  }

  /**
   * Get the value
   * @param columnName
   * @param dataType
   */
  public getValue(columnName: string, dataType?: GeoPackageDataType): any {
    let value;
    try {
      value = this.resultSet.getValue(columnName);
    } catch (e) {
      console.error(e)
      throw new GeoPackageException('Failed to get value for column name: ' + columnName);
    }
    return value;
  }

  /**
   * {@inheritDoc}
   */
  public getValueWithIndex(columnIdx: number): any {
    let value;
    try {
      value = this.resultSet.getValueWithIndex(columnIdx);
    } catch (e) {
      throw new GeoPackageException('Failed to get value for column at index: ' + columnIdx);
    }
    return value;
  }

  /**
   * Move the cursor to the next row.
   * @return true if another row
   */
  public moveToNext(): boolean {
    let next = false;
    try {
      next = this.resultSet.next();
    } catch (e) {
      console.error(e);
      throw new GeoPackageException('Failed to move ResultSet cursor to next');
    }
    return next;
  }

  /**
   * {@inheritDoc}
   */
  public getColumnCount(): number {
    let count = 0;
    try {
      count = this.resultSet.getColumnCount();
    } catch (e) {
      throw new GeoPackageException('Failed to get ResultSet column count');
    }
    return count;
  }

  /**
   * {@inheritDoc}
   */
  public getColumnNames(): string[] {
    let columnNames = [];
    try {
      columnNames = this.resultSet.getColumnNames();
    } catch (e) {
      throw new GeoPackageException('Failed to get ResultSet column count');
    }
    return columnNames;
  }

  /**
   * {@inheritDoc}
   */
  public getString(columnName: string): string {
    let value;
    try {
      value = this.resultSet.getString(columnName);
    } catch (e) {
      throw new GeoPackageException('Failed to get string value for column name: ' + columnName);
    }
    return value;
  }

  /**
   * {@inheritDoc}
   */
  public getNumber(columnName: string): number {
    let value;
    try {
      value = this.resultSet.getNumber(columnName);
    } catch (e) {
      throw new GeoPackageException('Failed to get number value for column name: ' + columnName);
    }
    return value;
  }

  /**
   * {@inheritDoc}
   */
  public getBuffer(columnName: string): Buffer {
    let value;
    try {
      value = this.resultSet.getBuffer(columnName);
    } catch (e) {
      throw new GeoPackageException('Failed to get blob buffer for column name: ' + columnName);
    }
    return value;
  }

  /**
   * {@inheritDoc}
   */
  public wasNull(): boolean {
    try {
      return this.resultSet.wasNull();
    } catch (e) {
      throw new GeoPackageException('Failed to determine if previous value retrieved was null');
    }
  }

  /**
   * {@inheritDoc}
   */
  public close(): void {
    try {
      this.resultSet.close();
    } catch (e) {
      throw new GeoPackageException('Failed to close ResultSet Statement');
    }
  }
}
