/**
 * attributeDao module.
 * @module features/user/featureDao
 */

var UserDao = require('../user/userDao')
  , AttributeRow = require('./attributeRow')
  , DataTypes = require('../db/dataTypes');

var util = require('util');

/**
 * Attribute DAO for reading attribute user data tables
 * @class AttributeDao
 * @extends {module:user/userDao~UserDao}
 * @param  {sqlite3} db              database connection
 * @param  {AttributeTable} table           attribute table
 */
var AttributeDao = function(geoPackage, table) {
  UserDao.call(this, geoPackage, table);
  if (!table.contents) {
    throw new Error('Attributes table has null Contents');
  }
  this.contents = table.contents;
}

util.inherits(AttributeDao, UserDao);

/**
 * Create a new attribute row with the column types and values
 * @param  {Array} columnTypes column types
 * @param  {Array} values      values
 * @return {AttributeRow}             attribute row
 */
AttributeDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new AttributeRow(this.table, columnTypes, values);
};

AttributeDao.prototype.getAttributeRow = function(result) {
  return this.getRow(result);
}

/**
 * Create a new attribute row
 * @return {AttributeRow} attribute row
 */
AttributeDao.prototype.newRow = function () {
  return new AttributeRow(this.table);
};

module.exports = AttributeDao;
