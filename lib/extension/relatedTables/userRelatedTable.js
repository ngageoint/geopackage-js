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
  this.relation_name = relationName;
  this.data_type = dataType;
}

util.inherits(UserRelatedTable, UserTable);

UserRelatedTable.prototype.setContents = function(contents) {
  this.contents = contents;

  // verify the contents have a relation name data type
  if (!contents.data_type || contents.data_type !== this.data_type) {
    throw new Error('The contents of this related table must have a data type of ' + this.data_type);
  }
}

/**
 * The UserRelatedTable
 * @type {UserRelatedTable}
 */
module.exports = UserRelatedTable;
