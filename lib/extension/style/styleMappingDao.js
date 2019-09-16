/**
 * @memberOf module:extension/style
 * @class StyleMappingDao
 */

var StyleMappingRow = require('./styleMappingRow')
  , StyleMappingTable = require('./styleMappingTable')
  , UserMappingTable = require('../relatedTables/userMappingTable')
  , UserMappingDao = require('../relatedTables/userMappingDao');

var util = require('util');

/**
 * Style Mapping DAO for reading user mapping data tables
 * @extends {module:extension/relatedTables~UserMappingDao}
 * @param  {module:user/custom~UserCustomDao} userCustomDao
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @constructor
 */
var StyleMappingDao = function(userCustomDao, geoPackage) {
  UserMappingDao.call(this, userCustomDao, geoPackage);
};

util.inherits(StyleMappingDao, UserMappingDao);

/**
 * Create a new {module:user/custom~UserCustomTable}
 * @param  {module:user/custom~UserCustomDao} userCustomDao
 * @return {module:user/custom~UserCustomTable} userCustomTable user custom table
 */
StyleMappingDao.prototype.createMappingTable = function(userCustomDao) {
  return new StyleMappingTable(userCustomDao.table.table_name, userCustomDao.table.columns);
};

/**
 * Create a new {module:extension/style.StyleMappingRow}
 * @return {module:extension/style.StyleMappingRow}
 */
StyleMappingDao.prototype.newRow = function() {
  return new StyleMappingRow(this.table);
};

/**
 * Create a user mapping row
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values values
 * @return {module:extension/style.StyleMappingRow} style mapping row
 */
StyleMappingDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new StyleMappingRow(this.table, columnTypes, values);
};

/**
 * Delete by base id and geometry type
 * @param  {Number} baseId base id
 * @param  {String} geometryType geometry type
 * @return {Number} number of deleted rows
 */
StyleMappingDao.prototype.deleteByBaseIdAndGeometryType = function(baseId, geometryType) {
  var where = '';
  where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_BASE_ID, baseId);
  where += ' AND ';
  where += this.buildWhereWithFieldAndValue(StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME, geometryType);
  var whereArgs = this.buildWhereArgs([baseId, geometryType]);
  return this.deleteWhere(where, whereArgs);
};

module.exports = StyleMappingDao;
