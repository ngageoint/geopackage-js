/**
 * UserRow module.
 * @module user/userRow
 */

import UserTable from './userTable'
import UserColumn from './userColumn'

var DataTypes = require('../db/dataTypes');

/**
 * User Row containing the values from a single result row
 * @class UserRow
 * @param  {UserTable} table       user table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {Array} values      values
 */
export default class UserRow {
  table: UserTable;
  columnTypes: any;
  values: any;
  
  constructor(table: UserTable, columnTypes?: any, values?: any) {
    /**
     * User table
     * @type {UserTable}
     */
    this.table = table;
    /**
     * Column types of this row, based upon the data values
     * @type {Object}
     */
    this.columnTypes = columnTypes;
    /**
     * Array of row values
     * @type {Object}
     */
    this.values = values;
    if (!this.columnTypes) {
      var columnCount = this.table.columnCount();
      this.columnTypes = {};
      this.values = {};
      for (var i = 0; i < columnCount; i++) {
        this.columnTypes[this.table.columnNames[i]] = this.table.columns[i].dataType;
        this.values[this.table.columnNames[i]] = this.table.columns[i].defaultValue;
      }
    }
  }
  /**
   * Get the column count
   * @return {number} column count
   */
  columnCount() {
    return this.table.columnCount();
  }
  /**
   * Get the column names
   * @return {Array} column names
   */
  getColumnNames() {
    return this.table.columnNames;
  }
  /**
   * Get the column name at the index
   * @param  {Number} index index
   * @return {string}       column name
   */
  getColumnNameWithIndex(index) {
    return this.table.getColumnNameWithIndex(index);
  }
  /**
   * Get the column index of the column name
   * @param  {string} columnName column name
   * @return {Number}            column index
   */
  getColumnIndexWithColumnName(columnName) {
    return this.table.getColumnIndex(columnName);
  }
  /**
   * Get the value at the index
   * @param  {Number} index index
   * @return {object}       value
   */
  getValueWithIndex(index) {
    var value = this.values[this.getColumnNameWithIndex(index)];
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
  getValueWithColumnName(columnName) {
    var value = this.values[columnName];
    var dataType = this.getRowColumnTypeWithColumnName(columnName);
    if (value === undefined || value === null)
      return value;
    if (dataType === DataTypes.GPKGDataType.GPKG_DT_BOOLEAN) {
      return value === 1 ? true : false;
    }
    else if (dataType === DataTypes.GPKGDataType.GPKG_DT_BLOB) {
      return Buffer.from(value);
    }
    return value;
  }
  toObjectValue(index, value) {
    var objectValue = value;
    var column = this.getColumnWithIndex(index);
    if (column.dataType === DataTypes.GPKGDataType.GPKG_DT_BOOLEAN && value) {
      return value === 1 ? true : false;
    }
    return objectValue;
  }
  toDatabaseValue(columnName) {
    var column = this.getColumnWithColumnName(columnName);
    var value = this.getValueWithColumnName(columnName);
    if (column.dataType === DataTypes.GPKGDataType.GPKG_DT_BOOLEAN) {
      return value === true ? 1 : 0;
    }
    return value;
  }
  /**
   * Get the row column type at the index
   * @param  {Number} index index
   * @return {Number}       row column type
   */
  getRowColumnTypeWithIndex(index) {
    return this.columnTypes[this.getColumnNameWithIndex(index)];
  }
  /**
   * Get the row column type of the column name
   * @param  {string} columnName column name
   * @return {Number}            row column type
   */
  getRowColumnTypeWithColumnName(columnName) {
    return this.columnTypes[columnName];
  }
  /**
   * Get the column at the index
   * @param  {Number} index index
   * @return {UserColumn}       column
   */
  getColumnWithIndex(index) {
    return this.table.getColumnWithIndex(index);
  }
  /**
   * Get the column of the column name
   * @param  {string} columnName column name
   * @return {UserColumn}            column
   */
  getColumnWithColumnName(columnName) {
    return this.table.getColumnWithColumnName(columnName);
  }
  /**
   * Get the id value, which is the value of the primary key
   * @return {Number} id value
   */
  getId() {
    if (this.getPkColumn()) {
      return this.getValueWithColumnName(this.getPkColumn().name);
    }
  }
  /**
   * Get the primary key column Index
   * @return {Number} pk index
   */
  getPkColumnIndex() {
    return this.table.pkIndex;
  }
  /**
   * Get the primary key column
   * @return {UserColumn} pk column
   */
  getPkColumn() {
    return this.table.getPkColumn();
  }
  /**
   * Set the value at the index
   * @param {Number} index index
   * @param {object} value value
   */
  setValueWithIndex(index, value) {
    if (index === this.table.pkIndex) {
      throw new Error('Cannot update the primary key of the row.  Table Name: ' + this.table.table_name + ', Index: ' + index + ', Name: ' + this.table.getPkColumn().name);
    }
    this.setValueWithColumnName(this.getColumnNameWithIndex(index), value);
  }
  /**
   * Set the value at the index without validation
   * @param {Number} index index
   * @param {Object} value value
   */
  setValueNoValidationWithIndex(index, value) {
    this.values[this.getColumnNameWithIndex(index)] = value;
  }
  /**
   * Set the value of the column name
   * @param {string} columnName column name
   * @param {Object} value      value
   */
  setValueWithColumnName(columnName, value) {
    var dataType = this.getRowColumnTypeWithColumnName(columnName);
    if (dataType === DataTypes.GPKGDataType.GPKG_DT_BOOLEAN) {
      value === true ? this.values[columnName] = 1 : this.values[columnName] = 0;
    }
    else if (dataType === DataTypes.GPKGDataType.GPKG_DT_DATE) {
      this.values[columnName] = value.toISOString().slice(0, 10);
    }
    else if (dataType === DataTypes.GPKGDataType.GPKG_DT_DATETIME) {
      this.values[columnName] = value.toISOString();
    }
    else {
      this.values[columnName] = value;
    }
  }
  hasIdColumn() {
    return this.table.pkIndex !== undefined;
  }
  hasId() {
    var hasId = false;
    if (this.hasIdColumn()) {
      var objectValue = this.getValueWithIndex(this.table.pkIndex);
      hasId = objectValue !== null && objectValue !== undefined && typeof objectValue === 'number';
    }
    return hasId;
  }
  /**
   * Set the primary key id value
   * @param {Number} id id
   */
  setId(id) {
    this.values[this.table.getPkColumn().name] = id;
  }
  /**
   * Clears the id so the row can be used as part of an insert or create
   */
  resetId() {
    this.values[this.table.getPkColumn().name] = undefined;
  }
  /**
   * Validate the value and its actual value types against eh column data type class
   * @param  {UserColumn} column     column
   * @param  {Object} value      value
   * @param  {Array} valueTypes value types
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  validateValueWithColumn(column, value, valueTypes) {
    // TODO implement validation
  }
}
