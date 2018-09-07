/**
 * @module attributes/attributeDao
 */

var UserDao = require('../user/userDao')
  , AttributeRow = require('./attributeRow');

var util = require('util');

/**
 * Attribute DAO for reading attribute user data tables
 * @class AttributeDao
 * @extends {module:user/userDao~UserDao}
 * @param  {module:geoPackage~GeoPackage} geopackage              geopackage object
 * @param  {module:attributes/attributeTable~AttributeTable} table           attribute table
 */
var AttributeDao = function(geoPackage, table) {
  UserDao.call(this, geoPackage, table);
  if (!table.contents) {
    throw new Error('Attributes table has null Contents');
  }
  /**
   * Contents of this AttributeDao
   * @member {module:core/contents~Contents}
   */
  this.contents = table.contents;
}

util.inherits(AttributeDao, UserDao);

/**
 * Create a new attribute row with the column types and values
 * @param  {Array} columnTypes column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @return {AttributeRow}             attribute row
 */
AttributeDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new AttributeRow(this.table, columnTypes, values);
};

/**
 * Create a new attribute row
 * @return {module:attributes/attributeRow~AttributeRow} attribute row
 */
AttributeDao.prototype.newRow = function () {
  return new AttributeRow(this.table);
};

module.exports = AttributeDao;
