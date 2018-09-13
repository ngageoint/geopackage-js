/**
 * userTable module.
 * @module user/userTable
 */

/**
 * Abstract user table
 * @class
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   user columns
 */
var UserTable = function(tableName, columns) {
  /**
   * The name of the table
   * @type {string}
   */
  this.table_name = tableName;

  // Sort the columns by index
  columns.sort(function(a, b) {
    return a.index - b.index;
  });

  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    if (column.index != i) {
      throw new Error('Column has wrong index of ' + column.index + ', found at index: ' + i + ', Table Name: ' + this.table_name);
    }
  }

  var pk = undefined;
  var tempColumnNames = new Array();
  var tempNameToIndex = {};

  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
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
}

/**
 * Check for duplicate column names
 * @param  {Number} index         index
 * @param  {Number} previousIndex previous index
 * @param  {string} column        column
 * @throws Throws an error if previous index is not undefined
 */
UserTable.prototype.duplicateCheck = function (index, previousIndex, column) {
  if(previousIndex !== undefined) {
    throw new Error('More than one ' + column + ' column was found for table \'' + this.table_name + '\'. Index ' + previousIndex + ' and ' + index);
  }
};

/**
 * Check for the expected data type
 * @param  {module:db/dataTypes~GPKGDataType} expected expected data type
 * @param  {module:user/userColumn~UserColumn} column   column
 * @throws Will throw an error if the actual column type does not match the expected column type
 */
UserTable.prototype.typeCheck = function (expected, column) {
  var actual = column.dataType;
  if (!actual || actual !== expected) {
    throw new Error('Unexpected ' + column.name + ' column data type was found for table \'' + this.table_name + '\', expected: ' + DataTypes.name(expected) + ', actual: ' + column.dataType);
  }
};

/**
 * Check for missing columns
 * @param  {Number} index  index
 * @param  {string} column column
 * @throws Will throw an error if no column is found
 */
UserTable.prototype.missingCheck = function (index, column) {
  if (index === undefined || index === null) {
    throw new Error('No ' + column + ' column was found for table \'' + this.table_name +'\'');
  }
};

/**
 * Get the column index of the column name
 * @param  {string} columnName column name
 * @return {Number} the column index
 * @throws Will throw an error if the column is not found in the table
 */
UserTable.prototype.getColumnIndex = function (columnName) {
  var index = this.nameToIndex[columnName];
  if (index === undefined || index === null) {
    throw new Error('Column does not exist in table \'' + this.table_name + '\', column: ' + columnName);
  }
  return index;
};

/**
 * Check if the table has the column
 * @param  {string} columnName name of the column
 * @return {Boolean}            true if the column exists in the table
 */
UserTable.prototype.hasColumn = function(columnName) {
  try {
    this.getColumnIndex(columnName);
    return true;
  } catch (e) {
    return false;
  }
  return false;
}

/**
 * Get the column name from the index
 * @param  {Number} index index
 * @return {string} the column name
 */
UserTable.prototype.getColumnNameWithIndex = function (index) {
  return this.columnNames[index];
};

/**
 * Get the column from the index
 * @param  {Number} index index
 * @return {module:user/userColumn~UserColumn} column at the index
 */
UserTable.prototype.getColumnWithIndex = function (index) {
  return this.columns[index];
};

/**
 * Get column with the column name
 * @param  {string} columnName column name
 * @return {module:user/userColumn~UserColumn}            column at the index
 */
UserTable.prototype.getColumnWithColumnName = function (columnName) {
  return this.getColumnWithIndex(this.getColumnIndex(columnName));
};

/**
 * Get the column count
 * @return {Number} the count of the columns
 */
UserTable.prototype.columnCount = function () {
  return this.columns.length;
};

/**
 * Get the primary key column
 * @return {module:user/userColumn~UserColumn} the primary key column
 */
UserTable.prototype.getPkColumn = function () {
  return this.columns[this.pkIndex];
};

UserTable.prototype.addUniqueConstraint = function (uniqueConstraint) {
  this.uniqueConstraints.push(uniqueConstraint);
};

UserTable.FEATURE_TABLE = 'FEATURE';
UserTable.TILE_TABLE = 'TILE';

module.exports = UserTable;
