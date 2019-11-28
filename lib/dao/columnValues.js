/**
 * @module dao/columnValues
 */
/**
 * Structure to define columns in a table
 * @class ColumnValues
 */
class ColumnValues {
  constructor() {
    this.values = {};
    this.columns = [];
  }
  /**
   * adds a column to the structure
   * @param  {string} columnName  name of column to add
   * @param  {module:user/userColumn~UserColumn} column column to add
   */
  addColumn(columnName, column) {
    this.columns.push(columnName);
    this.values[columnName] = column;
  }
  /**
   * Gets the column by name
   * @param  {string} columnName name of column
   * @return {module:user/userColumn~UserColumn}            user column
   */
  getValue(columnName) {
    return this.values[columnName];
  }
}

module.exports = ColumnValues;



