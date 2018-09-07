/**
 * @module dao/columnValues
 */

/**
 * Structure to define columns in a table
 * @class ColumnValues
 * @constructor
 */
var ColumnValues = function() {
  this.values = {};
  this.columns = [];
}

module.exports = ColumnValues;

/**
 * adds a column to the structure
 * @param  {string} columnName  name of column to add
 * @param  {module:user/userColumn~UserColumn} column column to add
 */
ColumnValues.prototype.addColumn = function (columnName, column) {
  this.columns.push(columnName);
  this.values[columnName] = column;
};

/**
 * Gets the column by name
 * @param  {string} columnName name of column
 * @return {module:user/userColumn~UserColumn}            user column
 */
ColumnValues.prototype.getValue = function (columnName) {
  return this.values[columnName];
};
