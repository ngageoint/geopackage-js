/**
 * UserRow module.
 * @module user/userRow
 */

var DataTypes = require('../db/dataTypes');

/**
 * User Row containing the values from a single result row
 * @class UserRow
 * @param  {UserTable} table       user table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {Array} values      values
 */
var UserRow = function(table, columnTypes, values) {
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

module.exports = UserRow;

/**
 * Get the column count
 * @return {number} column count
 */
UserRow.prototype.columnCount = function () {
  return this.table.columnCount();
};

/**
 * Get the column names
 * @return {Array} column names
 */
UserRow.prototype.getColumnNames = function () {
  return this.table.columnNames;
};

/**
 * Get the column name at the index
 * @param  {Number} index index
 * @return {string}       column name
 */
UserRow.prototype.getColumnNameWithIndex = function (index) {
  return this.table.getColumnNameWithIndex(index);
};

/**
 * Get the column index of the column name
 * @param  {string} columnName column name
 * @return {Number}            column index
 */
UserRow.prototype.getColumnIndexWithColumnName = function (columnName) {
  return this.table.getColumnIndex(columnName);
};

/**
 * Get the value at the index
 * @param  {Number} index index
 * @return {object}       value
 */
UserRow.prototype.getValueWithIndex = function (index) {
  var value = this.values[this.getColumnNameWithIndex(index)];
  if (value !== undefined) {
    value = this.toObjectValue(index, value);
  }
  return value;
};

/**
 * Get the value of the column name
 * @param  {string} columnName column name
 * @return {Object}            value
 */
UserRow.prototype.getValueWithColumnName = function (columnName) {
  var value = this.values[columnName];
  var dataType = this.getRowColumnTypeWithColumnName(columnName);
  if (value === undefined || value === null) return value;

  if (dataType === DataTypes.GPKGDataType.BOOLEAN) {
    return value === 1 ? true : false;
  } else if (dataType === DataTypes.GPKGDataType.BLOB) {
    return Buffer.from(value);
  }
  return value;
};

UserRow.prototype.toObjectValue = function (index, value) {
  var objectValue = value;
  var column = this.getColumnWithIndex(index);
  if (column.dataType === DataTypes.GPKGDataType.BOOLEAN && value) {
    return value === 1 ? true : false;
  }
  return objectValue;
};

UserRow.prototype.toDatabaseValue = function(columnName) {
  var column = this.getColumnWithColumnName(columnName);
  var value = this.getValueWithColumnName(columnName);
  if (column.dataType === DataTypes.GPKGDataType.BOOLEAN) {
    return value === true ? 1 : 0;
  }

  return value;
}

/**
 * Get the row column type at the index
 * @param  {Number} index index
 * @return {Number}       row column type
 */
UserRow.prototype.getRowColumnTypeWithIndex = function (index) {
  return this.columnTypes[this.getColumnNameWithIndex(index)];
};

/**
 * Get the row column type of the column name
 * @param  {string} columnName column name
 * @return {Number}            row column type
 */
UserRow.prototype.getRowColumnTypeWithColumnName = function (columnName) {
  return this.columnTypes[columnName];
};

/**
 * Get the column at the index
 * @param  {Number} index index
 * @return {UserColumn}       column
 */
UserRow.prototype.getColumnWithIndex = function (index) {
  return this.table.getColumnWithIndex(index);
};

/**
 * Get the column of the column name
 * @param  {string} columnName column name
 * @return {UserColumn}            column
 */
UserRow.prototype.getColumnWithColumnName = function (columnName) {
  return this.table.getColumnWithColumnName(columnName);
};

/**
 * Get the id value, which is the value of the primary key
 * @return {Number} id value
 */
UserRow.prototype.getId = function () {
  if (this.getPkColumn()) {
    return this.getValueWithColumnName(this.getPkColumn().name);
  }
};

/**
 * Get the primary key column Index
 * @return {Number} pk index
 */
UserRow.prototype.getPkColumnIndex = function () {
  return this.table.pkIndex;
};

/**
 * Get the primary key column
 * @return {UserColumn} pk column
 */
UserRow.prototype.getPkColumn = function () {
  return this.table.getPkColumn();
};

/**
 * Set the value at the index
 * @param {Number} index index
 * @param {object} value value
 */
UserRow.prototype.setValueWithIndex = function (index, value) {
  if (index === this.table.pkIndex) {
    throw new Error('Cannot update the primary key of the row.  Table Name: ' + this.table.tableName + ', Index: ' + index + ', Name: ' + this.table.getPkColumn().name);
  }
  this.setValueWithColumnName(this.getColumnNameWithIndex(index), value);
};

/**
 * Set the value at the index without validation
 * @param {Number} index index
 * @param {Object} value value
 */
UserRow.prototype.setValueNoValidationWithIndex = function (index, value) {
  this.values[this.getColumnNameWithIndex(index)] = value;
};

/**
 * Set the value of the column name
 * @param {string} columnName column name
 * @param {Object} value      value
 */
UserRow.prototype.setValueWithColumnName = function (columnName, value) {
  var dataType = this.getRowColumnTypeWithColumnName(columnName);
  if (dataType === DataTypes.GPKGDataType.BOOLEAN) {
    value === true ? this.values[columnName] = 1 : this.values[columnName] = 0;
  } else if (dataType === DataTypes.GPKGDataType.DATE) {
    this.values[columnName] = value.toISOString().slice(0,10);
  } else if (dataType === DataTypes.GPKGDataType.DATETIME) {
    this.values[columnName] = value.toISOString();
  } else {
    this.values[columnName] = value;
  }
};

UserRow.prototype.hasIdColumn = function() {
  return this.table.pkIndex !== undefined;
}

UserRow.prototype.hasId = function() {
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
UserRow.prototype.setId = function (id) {
  this.values[this.table.getPkColumn().name] = id;
};

/**
 * Clears the id so the row can be used as part of an insert or create
 */
UserRow.prototype.resetId = function () {
  this.values[this.table.getPkColumn().name] = undefined;
};

/**
 * Validate the value and its actual value types against eh column data type class
 * @param  {UserColumn} column     column
 * @param  {Object} value      value
 * @param  {Array} valueTypes value types
 */
UserRow.prototype.validateValueWithColumn = function (column, value, valueTypes) {
  // TODO implement validation
};
