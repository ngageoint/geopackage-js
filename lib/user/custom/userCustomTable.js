/**
 * @module user/custom
 */
var util = require('util');

var UserTable = require('../userTable');

/**
 * Create a new user custom table
 * @class
 * @extends module:user/userTable~UserTable
 * @param  {string} tableName       table name
 * @param  {module:user/userColumn~UserColumn[]} columns         user columns
 * @param  {string[]} requiredColumns required columns
 */
var UserCustomTable = function(tableName, columns, requiredColumns) {
  UserTable.call(this, tableName, columns);
  if (requiredColumns && requiredColumns.length) {
    var found = {};
    for (var i = 0; i < columns.length; i++) {
      var column = columns[i];
      if (requiredColumns.indexOf(column.name) !== -1) {
        var previousIndex = found[column.name];
        this.duplicateCheck(column.index, previousIndex, column.name);
        found[column.name] = column.index;
      }
    }
    for (var i = 0; i < requiredColumns.length; i++) {
      this.missingCheck(found[requiredColumns[i]], requiredColumns);
    }
  }
}

util.inherits(UserCustomTable, UserTable);

module.exports = UserCustomTable;
