/**
 * VTLayersDao module.
 * @module extension/vt
 */

var VTLayersRow = require('./vtLayersRow')
  , VTLayersTable = require('./vtLayersTable')
  , Dao = require('../../dao/dao')
  , UserDao = require('../../user/userDao')
  , UserTableReader = require('../../user/userTableReader');

var util = require('util');

/**
 * Vector tile layers DAO for reading layer tables
 * @class
 * @extends {module:user/userDao~UserDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
var VTLayersDao = function(geoPackage, table) {
  UserDao.call(this, geoPackage, table);
  this.vtLayersTable = table;
}

util.inherits(VTLayersDao, UserDao);

/**
 * Reads the table specified from the geopackage
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param  {string} tableName       table name
 * @param  {string[]} requiredColumns required columns
 * @return {module:user/userDao~UserDao}
 */
VTLayersDao.readTable = function(geoPackage, tableName) {
  var reader = new UserTableReader(tableName);
  var userTable = reader.readTable(geoPackage.getDatabase());
  return new VTLayersDao(geoPackage, userTable);
}

/**
 * Create a new vector tile layer row
 * @return {module:extension/relatedTables~MediaRow}
 */
VTLayersDao.prototype.newRow = function() {
  return new VTLayersDao(this.vtLayersTable);
}

/**
 * Create a VT layer row with the column types and values
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @return {module:extension/relatedTables~VTLayersRow}             VT layers row
 */
VTLayersDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new VTLayersRow(this.vtLayersTable, columnTypes, values);
};

/**
 * Gets the vector tile layer table
 * @return {module:extension/relatedTables~VTLayersTable}
 */
VTLayersDao.prototype.getTable = function() {
  return this.vtLayersTable;
}

/**
 * Gets the rows in this table by id
 * @param  {Number[]} ids ids to query for
 * @return {Object[]}
 */
VTLayersDao.prototype.getRows = function(ids) {
  var vtLayersRows = [];
  for (var i = 0; i < ids.length; i++) {
    var row = this.queryForId(ids[i]);
    if (row) {
      vtLayersRows.push(row);
    }
  }
  return vtLayersRows;
}

VTLayersDao.prototype.getAllRows = function() {
  return this.queryForAll();
}

VTLayersDao.prototype.getRowsForTableName = function(tableName) {
  return this.queryForAllEq(VTLayersTable.COLUMN_TABLE_NAME, tableName);
}

module.exports = VTLayersDao;
