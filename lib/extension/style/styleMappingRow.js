/**
 * @memberOf module:extension/style
 * @class StyleMappingRow
 */

var UserMappingRow = require('../relatedTables/userMappingRow');

/**
 * User Mapping Row containing the values from a single result set row
 * @extends UserMappingRow
 * @param  {module:extension/style.StyleMappingTable} styleMappingTable style mapping table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
class StyleMappingRow extends UserMappingRow {
  constructor(styleMappingTable, columnTypes, values) {
    super(styleMappingTable, columnTypes, values);
    this.styleMappingTable = styleMappingTable;
  }
  /**
   * Get the geometry type name column
   * @return {module:user/userColumn~UserColumn}
   */
  getGeometryTypeNameColumn() {
    return this.styleMappingTable.getGeometryTypeNameColumn();
  }
  /**
   * Gets the geometry type name
   * @return {string}
   */
  getGeometryTypeName() {
    return this.getValueWithColumnName(this.getGeometryTypeNameColumn().name);
  }
  /**
   * Sets the geometry type name
   * @param  {string} geometryTypeName geometry type name
   */
  setGeometryTypeName(geometryTypeName) {
    this.setValueWithColumnName(this.getGeometryTypeNameColumn().name, geometryTypeName);
  }
}

module.exports = StyleMappingRow;
