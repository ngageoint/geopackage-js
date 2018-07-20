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
var AttributeDao = function(db, table) {
  UserDao.call(this, db, table);
  if (!table.contents) {
    throw new Error('Attributes table has null Contents');
  }
}

util.inherits(AttributeDao, UserDao);

AttributeDao.prototype.createObject = function (results) {
  if (results) {
    return this.getRow(results);
  }
  return this.newRow();
};

/**
 * Get the attribute table
 * @return {AttributeTable} the attribute table
 */
AttributeDao.prototype.getAttributeTable = function () {
  return this.table;
};

/**
 * Get the attribute row for the current result in the result set
 * @param  {object} results results
 * @return {AttributeRow}         attribute row
 */
AttributeDao.prototype.getAttributeRow = function (results) {
  return this.getRow(results);
};

/**
 * Create a new attribute row with the column types and values
 * @param  {Array} columnTypes column types
 * @param  {Array} values      values
 * @return {AttributeRow}             attribute row
 */
AttributeDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new AttributeRow(this.getAttributeTable(), columnTypes, values);
};

/**
 * Create a new attribute row
 * @return {AttributeRow} attribute row
 */
AttributeDao.prototype.newRow = function () {
  return new AttributeRow(this.getAttributeTable());
};

module.exports = AttributeDao;
