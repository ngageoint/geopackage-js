/**
 * @memberOf module:extension/style
 * @class StyleMappingRow
 */

var UserMappingRow = require('../relatedTables/userMappingRow');

var util = require('util');

/**
 * User Mapping Row containing the values from a single result set row
 * @extends {module:extension/relatedTables~UserMappingRow}
 * @param  {module:extension/style.StyleMappingTable} styleMappingTable style mapping table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
var StyleMappingRow = function(styleMappingTable, columnTypes, values) {
  UserMappingRow.call(this, styleMappingTable, columnTypes, values);
  this.styleMappingTable = styleMappingTable;
};

util.inherits(StyleMappingRow, UserMappingRow);

/**
 * Get the geometry type name column
 * @return {module:user/userColumn~UserColumn}
 */
StyleMappingRow.prototype.getGeometryTypeNameColumn = function() {
  return this.styleMappingTable.getGeometryTypeNameColumn();
};

/**
 * Gets the geometry type name
 * @return {string}
 */
StyleMappingRow.prototype.getGeometryTypeName = function() {
  return this.getValueWithColumnName(this.getGeometryTypeNameColumn().name);
};

/**
 * Sets the geometry type name
 * @param  {string} geometryTypeName geometry type name
 */
StyleMappingRow.prototype.setGeometryTypeName = function(geometryTypeName) {
  this.setValueWithColumnName(this.getGeometryTypeNameColumn().name, geometryTypeName);
};

module.exports = StyleMappingRow;
