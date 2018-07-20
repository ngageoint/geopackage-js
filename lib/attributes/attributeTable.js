/**
 * attributeTable module.
 * @module attributes/attributeTable
 */

var UserTable = require('../user/userTable')
  , ContentsDao = require('../core/contents').ContentsDao;

var util = require('util');

/**
 * Represents a user attribute table
 * @param  {string} tableName table name
 * @param  {array} columns   attribute columns
 */
var AttributeTable = function(tableName, columns) {
  UserTable.call(this, tableName, columns);
}

util.inherits(AttributeTable, UserTable);

AttributeTable.prototype.setContents = function(contents) {
  this.contents = contents;
  if (contents.data_type !== ContentsDao.GPKG_CDT_ATTRIBUTES_NAME) {
    throw new Error('The Contents of an Attributes Table must have a data type of ' + ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);
  }
}

/**
 * The AttributeTable
 * @type {AttributeTable}
 */
module.exports = AttributeTable;
