/**
 * @module attributes/attributeTable
 */

var UserTable = require('../user/userTable')
  , ContentsDao = require('../core/contents').ContentsDao;

var util = require('util');

/**
 * Represents a user attribute table
 * @class AttributeTable
 * @extends {module:user/userTable~UserTable}
 * @constructor
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   attribute columns
 */
var AttributeTable = function(tableName, columns) {
  /**
   * Contents of this AttributeTable
   * @member {module:core/contents~Contents}
   */
  this.contents;

  UserTable.call(this, tableName, columns);
}

util.inherits(AttributeTable, UserTable);

/**
 * Set the contents
 * @param  {module:core/contents~Contents} contents the contents
 */
AttributeTable.prototype.setContents = function(contents) {
  this.contents = contents;
  if (contents.data_type !== ContentsDao.GPKG_CDT_ATTRIBUTES_NAME) {
    throw new Error('The Contents of an Attributes Table must have a data type of ' + ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);
  }
}

module.exports = AttributeTable;
