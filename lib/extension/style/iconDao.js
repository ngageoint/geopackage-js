/**
 * @memberOf module:extension/style
 * @class IconDao
 */

var IconRow = require('./IconRow')
  , MediaDao = require('../relatedTables/mediaDao');

var util = require('util');

/**
 * Icon DAO for reading user icon data tables
 * @extends {module:user/userDao~MediaDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
var IconDao = function(geoPackage, table) {
  MediaDao.call(this, geoPackage, table);
  this.table = table;
};

util.inherits(IconDao, MediaDao);

/**
 * Create a new icon row
 * @return {module:extension/style.IconRow}
 */
IconDao.prototype.newRow = function() {
  return new IconRow(this.table);
};

/**
 * Create a icon row with the column types and values
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @return {module:extension/style.IconRow}             icon row
 */
IconDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new IconRow(this.table, columnTypes, values);
};

module.exports = IconDao;
