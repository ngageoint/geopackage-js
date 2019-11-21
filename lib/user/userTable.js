var DataTypes = require('../db/dataTypes');
/**
 * `UserTable` models optional [user data tables](https://www.geopackage.org/spec121/index.html#_options)
 * in a [GeoPackage]{@link module:geoPackage~GeoPackage}.
 *
 * @class
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns user columns
 * @param  {string[]} [requiredColumns] required columns
 */
class UserTable {
  constructor(tableName, columns, requiredColumns) {
    /**
     * The name of the table
     * @type {string}
     */
    this.table_name = tableName;
    // Sort the columns by index
    columns.sort(function (a, b) {
      return a.index - b.index;
    });
    for (var i = 0; i < columns.length; i++) {
      var column = columns[i];
      if (column.index !== i) {
        throw new Error('Column has wrong index of ' + column.index + ', found at index: ' + i + ', Table Name: ' + this.table_name);
      }
    }
    var pk = undefined;
    var tempColumnNames = new Array();
    var tempNameToIndex = {};
    for (i = 0; i < columns.length; i++) {
      column = columns[i];
      var index = column.index;
      if (column.primaryKey) {
        if (pk !== undefined) {
          throw new Error('More than one primary key column was found for table \'' + this.table_name + '\'. Index ' + pk + ' and ' + index);
        }
        pk = index;
      }
      tempColumnNames.push(column.name);
      tempNameToIndex[column.name] = index;
    }
    /**
     * Array of columns
     * @type {module:user/userColumn~UserColumn[]}
     */
    this.columns = columns;
    /**
     * Array of column names
     * @type {string[]}
     */
    this.columnNames = tempColumnNames;
    /**
     * Mapping between column names and their index
     * @type {Object}
     */
    this.nameToIndex = tempNameToIndex;
    this.uniqueConstraints = [];
    /**
     * Primary key column Index
     * @type {Number}
     */
    this.pkIndex = pk;
    this.requiredColumns = requiredColumns;
  }
  /**
   * Check for duplicate column names
   * @param  {Number} index         index
   * @param  {Number} previousIndex previous index
   * @param  {string} column        column
   * @throws Throws an error if previous index is not undefined
   */
  duplicateCheck(index, previousIndex, column) {
    if (previousIndex !== undefined) {
      throw new Error('More than one ' + column + ' column was found for table \'' + this.table_name + '\'. Index ' + previousIndex + ' and ' + index);
    }
  }
  /**
   * Check for the expected data type
   * @param  {module:db/dataTypes~GPKGDataType} expected expected data type
   * @param  {module:user/userColumn~UserColumn} column   column
   * @throws Will throw an error if the actual column type does not match the expected column type
   */
  typeCheck(expected, column) {
    var actual = column.dataType;
    if (!actual || actual !== expected) {
      throw new Error('Unexpected ' + column.name + ' column data type was found for table \'' + this.table_name + '\', expected: ' + DataTypes.name(expected) + ', actual: ' + column.dataType);
    }
  }
  /**
   * Check for missing columns
   * @param  {Number} index  index
   * @param  {string} column column
   * @throws Will throw an error if no column is found
   */
  missingCheck(index, column) {
    if (index === undefined || index === null) {
      throw new Error('No ' + column + ' column was found for table \'' + this.table_name + '\'');
    }
  }
  /**
   * Get the column index of the column name
   * @param  {string} columnName column name
   * @return {Number} the column index
   * @throws Will throw an error if the column is not found in the table
   */
  getColumnIndex(columnName) {
    var index = this.nameToIndex[columnName];
    if (index === undefined || index === null) {
      throw new Error('Column does not exist in table \'' + this.table_name + '\', column: ' + columnName);
    }
    return index;
  }
  /**
   * Check if the table has the column
   * @param  {string} columnName name of the column
   * @return {Boolean}            true if the column exists in the table
   */
  hasColumn(columnName) {
    try {
      this.getColumnIndex(columnName);
      return true;
    }
    catch (e) {
      return false;
    }
  }
  /**
   * Get the column name from the index
   * @param  {Number} index index
   * @return {string} the column name
   */
  getColumnNameWithIndex(index) {
    return this.columnNames[index];
  }
  /**
   * Get the column from the index
   * @param  {Number} index index
   * @return {module:user/userColumn~UserColumn} column at the index
   */
  getColumnWithIndex(index) {
    return this.columns[index];
  }
  /**
   * Get column with the column name
   * @param  {string} columnName column name
   * @return {module:user/userColumn~UserColumn}            column at the index
   */
  getColumnWithColumnName(columnName) {
    return this.getColumnWithIndex(this.getColumnIndex(columnName));
  }
  /**
   * Get the column count
   * @return {Number} the count of the columns
   */
  columnCount() {
    return this.columns.length;
  }
  /**
   * Get the primary key column
   * @return {module:user/userColumn~UserColumn} the primary key column
   */
  getPkColumn() {
    return this.columns[this.pkIndex];
  }
  /**
   * Get the primary key id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn() {
    return this.getPkColumn();
  }
  addUniqueConstraint(uniqueConstraint) {
    this.uniqueConstraints.push(uniqueConstraint);
  }
}

UserTable.FEATURE_TABLE = 'FEATURE';
UserTable.TILE_TABLE = 'TILE';

module.exports = UserTable;
