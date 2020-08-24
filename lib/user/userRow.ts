/**
 * UserRow module.
 * @module user/userRow
 */

import { UserTable } from './userTable';

import { GeoPackageDataType } from '../db/geoPackageDataType';
import { DBValue } from '../db/dbAdapter';
import { UserColumn } from './userColumn';

export class UserRow {
  /**
   * User Row containing the values from a single result row
   * @param table User Table
   * @param columnTypes Column types of this row, based upon the data values
   * @param values Array of the row values
   */
  constructor(
    public table: UserTable<UserColumn>,
    public columnTypes?: { [key: string]: GeoPackageDataType },
    public values?: Record<string, DBValue>,
  ) {
    if (!this.columnTypes) {
      const columnCount = this.table.getColumnCount();
      this.columnTypes = {};
      this.values = {};
      for (let i = 0; i < columnCount; i++) {
        this.columnTypes[this.table.columns.getColumnName(i)] = this.table.columns.getColumnForIndex(i).dataType;
        this.values[this.table.columns.getColumnName(i)] = this.table.columns.getColumnForIndex(i).defaultValue;
      }
    }
  }

  /**
   * Gets the id column
   * @return {module:user/userColumn~UserColumn}
   */
  get idColumn(): UserColumn {
    return this.table.getIdColumn();
  }
  /**
   * Get the column count
   * @return {number} column count
   */
  get columnCount(): number {
    return this.table.getColumnCount();
  }
  /**
   * Get the column names
   * @return {Array} column names
   */
  get columnNames(): string[] {
    return this.table.columns._columnNames;
  }
  /**
   * Get the column name at the index
   * @param  {Number} index index
   * @return {string}       column name
   */
  getColumnNameWithIndex(index: number): string {
    return this.table.getColumnNameWithIndex(index);
  }
  /**
   * Get the column index of the column name
   * @param  {string} columnName column name
   * @return {Number}            column index
   */
  getColumnIndexWithColumnName(columnName: string): number {
    return this.table.getColumnIndex(columnName);
  }
  /**
   * Get the value at the index
   * @param  {Number} index index
   * @return {object}       value
   */
  getValueWithIndex(index: number): any {
    let value = this.values[this.getColumnNameWithIndex(index)];
    if (value !== undefined) {
      value = this.toObjectValue(index, value);
    }
    return value;
  }
  /**
   * Get the value of the column name
   * @param  {string} columnName column name
   * @return {Object}            value
   */
  getValueWithColumnName(columnName: string): any {
    const value = this.values[columnName];
    const dataType = this.getRowColumnTypeWithColumnName(columnName);
    if (value === undefined || value === null) return value;
    if (dataType === GeoPackageDataType.BOOLEAN) {
      return value === 1 ? true : false;
    } else if (dataType === GeoPackageDataType.BLOB) {
      return Buffer.from(value as Uint8Array);
    }
    return value;
  }
  /**
   * Get the value from the database as an object based on the column
   * @param index column index
   * @param value value from the database
   */
  toObjectValue(index: number, value: DBValue): any {
    const objectValue = value;
    const column = this.getColumnWithIndex(index);
    if (column.dataType === GeoPackageDataType.BOOLEAN && value) {
      return value === 1 ? true : false;
    }
    return objectValue;
  }
  /**
   * Get the value which will be persisted to the database based on the column
   * @param columnName name of the column
   */
  toDatabaseValue(columnName: string): DBValue {
    const column = this.getColumnWithColumnName(columnName);
    const value = this.getValueWithColumnName(columnName);
    if (column.dataType === GeoPackageDataType.BOOLEAN) {
      return value === true ? 1 : 0;
    }
    return value;
  }
  /**
   * Get the row column type at the index
   * @param  {Number} index index
   * @return {Number}       row column type
   */
  getRowColumnTypeWithIndex(index: number): number {
    return this.columnTypes[this.getColumnNameWithIndex(index)];
  }
  /**
   * Get the row column type of the column name
   * @param  {string} columnName column name
   * @return {Number}            row column type
   */
  getRowColumnTypeWithColumnName(columnName: string): number {
    return this.columnTypes[columnName];
  }
  /**
   * Get the column at the index
   * @param  {Number} index index
   * @return {UserColumn}       column
   */
  getColumnWithIndex(index: number): UserColumn {
    return this.table.getColumnWithIndex(index);
  }
  /**
   * Get the column of the column name
   * @param  {string} columnName column name
   * @return {UserColumn}            column
   */
  getColumnWithColumnName(columnName: string): UserColumn {
    return this.table.getColumnWithColumnName(columnName);
  }
  /**
   * Get the id value, which is the value of the primary key
   * @return {Number} id value
   */
  get id(): number {
    let id = null;
    if (this.pkColumn) {
      id = this.getValueWithIndex(this.pkColumnIndex);
    }
    return id;
  }
  /**
   * Set the primary key id value
   * @param {Number} id id
   */
  set id(id: number) {
    this.values[this.table.getPkColumnName()] = id;
  }
  /**
   * Get the primary key column Index
   * @return {Number} pk index
   */
  get pkColumnIndex(): number {
    return this.table.getUserColumns().getPkColumnIndex();
  }
  /**
   * Get the primary key column
   * @return {UserColumn} pk column
   */
  get pkColumn(): UserColumn {
    return this.table.getPkColumn();
  }
  /**
   * Set the value at the index
   * @param {Number} index index
   * @param {object} value value
   */
  setValueWithIndex(index: number, value: any): void {
    if (index === this.table.getUserColumns().getPkColumnIndex()) {
      throw new Error(
        'Cannot update the primary key of the row.  Table Name: ' +
          this.table.getTableName() +
          ', Index: ' +
          index +
          ', Name: ' +
          this.table.getPkColumnName(),
      );
    }
    this.setValueWithColumnName(this.getColumnNameWithIndex(index), value);
  }
  /**
   * Set the value at the index without validation
   * @param {Number} index index
   * @param {Object} value value
   */
  setValueNoValidationWithIndex(index: number, value: any): void {
    this.values[this.getColumnNameWithIndex(index)] = value;
  }
  /**
   * Set the value of the column name
   * @param {string} columnName column name
   * @param {Object} value      value
   */
  setValueWithColumnName(columnName: string, value: any): void {
    const dataType = this.getRowColumnTypeWithColumnName(columnName);
    if (dataType === GeoPackageDataType.BOOLEAN) {
      value === true ? (this.values[columnName] = 1) : (this.values[columnName] = 0);
    } else if (dataType === GeoPackageDataType.DATE) {
      this.values[columnName] = value.toISOString().slice(0, 10);
    } else if (dataType === GeoPackageDataType.DATETIME) {
      this.values[columnName] = value.toISOString();
    } else {
      this.values[columnName] = value;
    }
  }
  hasIdColumn(): boolean {
    return this.table.getUserColumns().getPkColumnIndex() !== undefined;
  }
  hasId(): boolean {
    let hasId = false;
    if (this.hasIdColumn()) {
      const objectValue = this.getValueWithIndex(this.table.getUserColumns().getPkColumnIndex());
      hasId = objectValue !== null && objectValue !== undefined && typeof objectValue === 'number';
    }
    return hasId;
  }
  /**
   * Clears the id so the row can be used as part of an insert or create
   */
  resetId(): void {
    this.values[this.table.getPkColumnName()] = undefined;
  }
}
