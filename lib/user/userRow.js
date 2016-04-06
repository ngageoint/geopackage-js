/**
 * UserRow module.
 * @module user/userRow
 */

/**
 * User Row containing the values from a single result row
 * @class UserRow
 * @param  {UserTable} table       user table
 * @param  {Array} columnTypes column types
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
   * @type {Array}
   */
  this.columnTypes = columnTypes;
  /**
   * Array of row values
   * @type {Array}
   */
  this.values = values;

  if (!this.columnTypes) {
    var columnCount = this.table.columnCount();
    this.columnTypes = [];
    this.values = [];
    for (var i = 0; i < columnCount; i++) {
      this.columnTypes.push(NULL);
      this.values.push(NULL)
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
  return this.table.getColumnIndexWithColumnName(columnName);
};

/**
 * Get the value at the index
 * @param  {Number} index index
 * @return {object}       value
 */
UserRow.prototype.getValueWithIndex = function (index) {
  var value = this.values[index];
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
  return this.getValueWithIndex(this.table.getColumnIndexWithColumnName(columnName));
};

/**
 * Get the database formatted value at the index
 * @param  {[type]} index [description]
 * @return {[type]}       [description]
 */
UserRow.prototype.getDatabaseValueWithIndex = function (index) {
  var value = this.values[index];
  if (value !== undefined) {
    value = this.toDatabaseValue(index, value);
  }
  return value;
};

/**
 * Get the database formatted value of the column name
 * @param  {string} columnName column name
 * @return {Object}            value
 */
UserRow.prototype.getDatabaseValueWithColumnName = function (columnName) {
  return this.getDatabaseValueWithIndex(this.table.getColumnIndexWithColumnName(columnName));
};

/**
 * Get the row column type at the index
 * @param  {Number} index index
 * @return {Number}       row column type
 */
UserRow.prototype.getRowColumnTypeWithIndex = function (index) {
  return this.columnTypes[index];
};

/**
 * Get the row column type of the column name
 * @param  {string} columnName column name
 * @return {Number}            row column type
 */
UserRow.prototype.getRowColumnTypeWithColumnName = function (columnName) {
  return this.columnTypes[this.table.getColumnIndexWithColumnName(columnName)];
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
  var id = undefined;
  var objectValue = this.getValueWithIndex(this.getPkColumnIndex());
  if (objectValue == undefined) {
    throw new Error('Row Id was null. Table: ' + this.table.tableName + ', Column Index: ' + this.getPkColumnIndex() + ', Column Name: ' + this.getPkColumn().name);
  }
  // TODO ensure the id was a number
  id = objectValue;
  return id;
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
  this.setValueNoValidationWithIndex(index, value);
};

/**
 * Set the value at the index without validation
 * @param {Number} index index
 * @param {Object} value value
 */
UserRow.prototype.setValueNoValidationWithIndex = function (index, value) {
  self.values[index] = value;
};

/**
 * Set the value of the column name
 * @param {string} columnName column name
 * @param {Object} value      value
 */
UserRow.prototype.setValueWithColumnName = function (columnName, value) {
  this.setValueWithIndex(this.getColumnIndexWithColumnName(columnName), value);
};

/**
 * Set the primary key id value
 * @param {Number} id id
 */
UserRow.prototype.setId = function (id) {
  this.values[this.getPkColumnIndex()] = id;
};

/**
 * Clears the id so the row can be used as part of an insert or create
 */
UserRow.prototype.resetId = function () {
  this.values[this.getPkColumnIndex()] = undefined;
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
