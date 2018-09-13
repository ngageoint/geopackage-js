/**
 * MediaDao module.
 * @module extension/relatedTables
 */

var MediaRow = require('./mediaRow')
  , MediaTable = require('./mediaTable')
  , Dao = require('../../dao/dao')
  , UserDao = require('../../user/userDao');

var util = require('util');

/**
 * User Media DAO for reading user media data tables
 * @class
 * @extends {module:user/userDao~UserDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
var MediaDao = function(geoPackage, table) {
  UserDao.call(this, geoPackage, table);
  this.mediaTable = table;
}

util.inherits(MediaDao, UserDao);

/**
 * Create a new media row
 * @return {module:extension/relatedTables~MediaRow}
 */
MediaDao.prototype.newRow = function() {
  return new MediaRow(this.mediaTable);
}

/**
 * Create a media row with the column types and values
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @return {module:extension/relatedTables~MediaRow}             media row
 */
MediaDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new MediaRow(this.mediaTable, columnTypes, values);
};

/**
 * Gets the media table
 * @return {module:extension/relatedTables~MediaTable}
 */
MediaDao.prototype.getTable = function() {
  return this.mediaTable;
}

/**
 * Gets the rows in this table by id
 * @param  {Number[]} ids ids to query for
 * @return {Object[]}
 */
MediaDao.prototype.getRows = function(ids) {
  var mediaRows = [];
  for (var i = 0; i < ids.length; i++) {
    var row = this.queryForId(ids[i]);
    if (row) {
      mediaRows.push(row);
    }
  }
  return mediaRows;
}

module.exports = MediaDao;
