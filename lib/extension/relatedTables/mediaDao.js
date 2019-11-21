/**
 * MediaDao module.
 * @module extension/relatedTables
 */

var MediaRow = require('./mediaRow')
  , UserDao = require('../../user/userDao')
  , UserTableReader = require('../../user/userTableReader');

/**
 * User Media DAO for reading user media data tables
 * @class
 * @extends UserDao
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
class MediaDao extends UserDao {
  constructor(geoPackage, table) {
    super(geoPackage, table);
    this.mediaTable = table;
  }
  /**
   * Create a new media row
   * @return {module:extension/relatedTables~MediaRow}
   */
  newRow() {
    return new MediaRow(this.mediaTable);
  }
  /**
   * Create a media row with the column types and values
   * @param  {module:db/dataTypes[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/relatedTables~MediaRow}             media row
   */
  newRowWithColumnTypes(columnTypes, values) {
    return new MediaRow(this.mediaTable, columnTypes, values);
  }
  /**
   * Gets the media table
   * @return {module:extension/relatedTables~MediaTable}
   */
  getTable() {
    return this.mediaTable;
  }
  /**
   * Reads the table specified from the geopackage
   * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
   * @param  {string} tableName       table name
   * @return {module:user/userDao~UserDao}
   */
  static readTable(geoPackage, tableName) {
    var reader = new UserTableReader(tableName);
    var userTable = reader.readTable(geoPackage.getDatabase());
    return new MediaDao(geoPackage, userTable);
  }
}

module.exports = MediaDao;
