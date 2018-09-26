/**
 * userRelatedTable module.
 * @module extension/relatedTables
 */

var UserTable = require('../../user/userTable')
  , UserColumn = require('../../user/userColumn')
  , DataTypes = require('../../db/dataTypes');

var util = require('util');

/**
 * User Defined Related Table
 * @param  {string} tableName table name
 * @param  {array} columns   attribute columns
 */
/**
 * User Defined Related Table
 * @param  {string} tableName       table name
 * @param  {string} relationName    relation name
 * @param  {string} dataType        Contents data type
 * @param  {module:user/userColumn~UserColumn} columns         columns
 * @param  {string[]} requiredColumns required columns
 * @return {module:extension/relatedTables~UserRelatedTable}
 */
var UserRelatedTable = function(tableName, relationName, dataType, columns, requiredColumns) {
  UserTable.call(this, tableName, columns, requiredColumns);
  this.relation_name = relationName;
  this.data_type = dataType;
}

util.inherits(UserRelatedTable, UserTable);

/**
 * Sets the contents
 * @param  {module:core/contents~Contents} contents contents
 * @throw Error if the contents data type does not match this data type
 */
UserRelatedTable.prototype.setContents = function(contents) {
  this.contents = contents;

  // verify the contents have a relation name data type
  if (!contents.data_type || contents.data_type !== this.data_type) {
    throw new Error('The contents of this related table must have a data type of ' + this.data_type);
  }
}

module.exports = UserRelatedTable;
