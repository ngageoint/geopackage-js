/**
 * @memberOf module:extension/style
 * @class IconDao
 */

var IconRow = require('./iconRow')
  , MediaDao = require('../relatedTables/mediaDao');

/**
 * Icon DAO for reading user icon data tables
 * @extends MediaDao
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
class IconDao extends MediaDao {
  constructor(geoPackage, table) {
    super(geoPackage, table);
    this.table = table;
  }
  /**
   * Create a new icon row
   * @return {module:extension/style.IconRow}
   */
  newRow() {
    return new IconRow(this.table);
  }
  /**
   * Create a icon row with the column types and values
   * @param  {module:db/dataTypes[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/style.IconRow}             icon row
   */
  newRowWithColumnTypes(columnTypes, values) {
    return new IconRow(this.table, columnTypes, values);
  }
}

module.exports = IconDao;
