/**
 * @memberOf module:extension/style
 * @class StyleDao
 */

var StyleRow = require('./styleRow')
  , StyleTable = require('./styleTable')
  , AttributesDao = require('../../attributes/attributeDao');

var util = require('util');

/**
 * Style DAO for reading style tables
 * @extends {module:attributes/attributeDao~AttributesDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
var StyleDao = function(geoPackage, table) {
  AttributesDao.call(this, geoPackage, table);
  this.table = table;
};

util.inherits(StyleDao, AttributesDao);

/**
 * Creates a StyleRow object from the results
 * @param results
 * @returns {module:extension/style.StyleRow}
 */
StyleDao.prototype.createObject = function (results) {
  if (results) {
    return this.getRow(results);
  }
  return this.newRow();
};

/**
 * Create a new style row
 * @return {module:extension/style.StyleRow}
 */
StyleDao.prototype.newRow = function() {
  return new StyleRow(this.table);
};

/**
 * Create a style row with the column types and values
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @return {module:extension/style.StyleRow}             icon row
 */
StyleDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new StyleRow(this.table, columnTypes, values);
};

module.exports = StyleDao;
