/**
 * userTable module.
 * @module user/userTable
 */

/**
 * Abstract user table
 * @param  {string} tableName table name
 * @param  {array} columns   feature columns
 */
var UserTable = function(tableName, columns) {
  this.table_name = tableName;

  // Sort the columns by index
  columns.sort(function(a, b) {
    return a.index - b.index;
  });

  for (var i = 0; i < columns.length; i++) {
    var column = columns[i];
    if (!column) {
      throw new Error('No column found at index: ' + i + ', Table Name: ' + this.table_name);
    } else if (column.index != i) {
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
      if (pk) {
        throw new Error('More than one primary key column was found for table \'' + this.table_name + '\'. Index ' + pk + ' and ' + index);
      }
      pk = index;
    }
    tempColumnNames.push(column.name);
    tempNameToIndex[column.name] = index;
  }

  this.columns = columns;
  this.columnNames = tempColumnNames;
  this.nameToIndex = tempNameToIndex;

  if (pk === undefined) {
    throw new Error('No primary key column was found for table \'' + this.table_name + '\'');
  }
  this.pkIndex = pk;
}

/**
 * Check for duplicate column names
 * @param  {Number} index         index
 * @param  {Number} previousIndex previous index
 * @param  {string} column        column
 */
UserTable.prototype.duplicateCheck = function (index, previousIndex, column) {
  if(previousIndex) {
    throw new Error('More than one ' + column + ' column was found for table \'' + this.table_name + '\'. Index ' + previousIndex + ' and ' + index);
  }
};

/**
 * Check for the expected data type
 * @param  {GPKGDataType} expected expected data type
 * @param  {UserColumn} column   column
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
 */
UserTable.prototype.getColumnIndex = function (columnName) {
  var index = this.nameToIndex[columnName];
  if (index === undefined || index === null) {
    throw new Error('Column does not exist in table \'' + this.table_name + '\', column: ' + columnName);
  }
  return index;
};

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
 * @return {Object} column at the index
 */
UserTable.prototype.getColumnWithIndex = function (index) {
  return this.columns[index];
};

/**
 * Get column with the column name
 * @param  {string} columnName column name
 * @return {Object}            column at the index
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
 * @return {Object} the primary key column
 */
UserTable.prototype.getPkColumn = function () {
  return this.columns[this.pkIndex];
};

UserTable.FEATURE_TABLE = 'FEATURE';
UserTable.TILE_TABLE = 'TILE';


// -(void) addUniqueConstraint: (GPKGUserUniqueConstraint *) uniqueConstraint{
//     [GPKGUtils addObject:uniqueConstraint toArray:self.uniqueConstraints];
// }

module.exports = UserTable;
