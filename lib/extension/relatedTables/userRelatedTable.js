/**
 * userRelatedTable module.
 * @module extension/relatedTables/userRelatedTable
 */

var UserTable = require('../../user/userTable')
  , UserColumn = require('../../user/userColumn')
  , DataTypes = require('../../db/dataTypes');

var util = require('util');

/**
 * Represents a user attribute table
 * @param  {string} tableName table name
 * @param  {array} columns   attribute columns
 */
var UserRelatedTable = function(tableName, relationName, dataType, columns, requiredColumns) {
  UserTable.call(this, tableName, columns, requiredColumns);
  this.relationName = relationName;
  this.dataType = dataType;
}

util.inherits(UserRelatedTable, UserTable);

UserRelatedTable.prototype.setContents = function(contents) {
  this.contents = contents;

  // verify the contents have a relation name data type
  if (contents.data_type || contents.data_type !== this.dataType) {
    throw new Error('The contents of this related table must have a data type of ' + this.dataType);
  }
}

/**
 * The UserRelatedTable
 * @type {UserRelatedTable}
 */
module.exports = UserRelatedTable;
