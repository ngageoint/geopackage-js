/**
 * SimpleAttributesDao module.
 * @module extension/relatedTables
 */

var SimpleAttributesRow = require('./simpleAttributesRow')
  , SimpleAttributesTable = require('./simpleAttributesTable')
  , Dao = require('../../dao/dao')
  , UserDao = require('../../user/userDao');

var util = require('util');

/**
 * User Simple Attributes DAO for reading user simple attributes data tables
 * @class
 * @extends {module:user/userDao~UserDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
var SimpleAttributesDao = function(geoPackage, table) {
  UserDao.call(this, geoPackage, table);
  this.simpleAttributesTable = table;
}

util.inherits(SimpleAttributesDao, UserDao);

/**
 * Create a new {module:extension/relatedTables~SimpleAttributesRow}
 * @return {module:extension/relatedTables~SimpleAttributesRow}
 */
SimpleAttributesDao.prototype.newRow = function() {
  return new SimpleAttributesRow(this.simpleAttributesTable);
}

/**
 * Create a new {module:extension/relatedTables~SimpleAttributesRow} with the column types and values
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @return {module:extension/relatedTables~SimpleAttributesRow}             simple attributes row
 */
SimpleAttributesDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new SimpleAttributesRow(this.simpleAttributesTable, columnTypes, values);
};

/**
 * Gets the {module:extension/relatedTables~SimpleAttributesTable}
 * @return {module:extension/relatedTables~SimpleAttributesTable}
 */
SimpleAttributesDao.prototype.getTable = function() {
  return this.simpleAttributesTable;
}

/**
 * Get the simple attributes rows from this table by ids
 * @param  {Number[]} ids array of ids
 * @return {module:extension/relatedTables~SimpleAttributesRow[]}
 */
SimpleAttributesDao.prototype.getRows = function(ids) {
  var simpleAttributesRows = [];
  for (var i = 0; i < ids.length; i++) {
    var row = this.queryForId(ids[i]);
    if (row) {
      simpleAttributesRows.push(row);
    }
  }
  return simpleAttributesRows;
}

module.exports = SimpleAttributesDao;
