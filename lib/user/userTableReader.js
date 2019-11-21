/**
 * userTableReader module.
 * @module user/userTableReader
 */

var UserColumn = require('./userColumn')
  , UserTable = require('./userTable')
  , DataTypes = require('../db/dataTypes');

/**
 * @class
 */
class UserTableReader {
  /**
   * 
   * @param {string} tableName name of the table
   * @param {string[]} [requiredColumns] array of the required column nammes
   */
  constructor(tableName, requiredColumns) {
    // eslint-disable-next-line camelcase
    this.table_name = tableName;
    this.requiredColumns = requiredColumns;
  }
  /**
   * Read the table
   * @param  {object} db db connection
   * @return {module:user/userTable~UserTable}
   */
  readTable(db) {
    var columnList = [];
    var results = db.all('PRAGMA table_info(\'' + this.table_name + '\')');
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      var index = result[GPKG_UTR_CID];
      var name = result[GPKG_UTR_NAME];
      var type = result[GPKG_UTR_TYPE];
      var notNull = result[GPKG_UTR_NOT_NULL] === 1;
      var primarykey = result[GPKG_UTR_PK] === 1;
      var max = undefined;
      if (type && type.lastIndexOf(')') === type.length - 1) {
        var maxStart = type.indexOf('(');
        if (maxStart > -1) {
          var maxString = type.substring(maxStart + 1, type.length - 1);
          if (maxString !== '') {
            max = parseInt(maxString);
            type = type.substring(0, maxStart);
          }
        }
      }
      var defaultValue = undefined;
      if (result[GPKG_UTR_DFLT_VALUE]) {
        defaultValue = result[GPKG_UTR_DFLT_VALUE].replace(/\\'/g, '');
      }
      var column = this.createColumnWithResults(result, index, name, type, max, notNull, defaultValue, primarykey);
      columnList.push(column);
    }
    if (columnList.length === 0) {
      throw new Error('Table does not exist: ' + this.table_name);
    }
    return this.createTable(this.table_name, columnList, this.requiredColumns);
  }
  /**
   * Creates a user column
   * @param {Object} result
   * @param {Number} index        column index
   * @param {string} name         column name
   * @param {module:db/dataTypes~GPKGDataType} type         data type
   * @param {Number} max max value
   * @param {Boolean} notNull      not null
   * @param {Object} defaultValue default value or nil
   * @param {Boolean} primaryKey primary key
   * @return {module:user/custom~UserCustomColumn}
   */
  createColumnWithResults(result, index, name, type, max, notNull, defaultValue, primaryKey) {
    var dataType = DataTypes.fromName(type);
    return new UserColumn(index, name, dataType, max, notNull, defaultValue, primaryKey);
  }
  /**
   * Create the table
   * @param  {string} tableName table name
   * @param  {module:dao/columnValues~ColumnValues[]} columns   columns
   * @param  {string[]} [requiredColumns] required columns
   * @return {module:user/userTable~UserTable}           the user table
   * 
   */
  createTable(tableName, columns, requiredColumns) {
    return new UserTable(tableName, columns, requiredColumns);
  }
}

var GPKG_UTR_CID = "cid";
var GPKG_UTR_NAME = "name";
var GPKG_UTR_TYPE = "type";
var GPKG_UTR_NOT_NULL = "notnull";
var GPKG_UTR_PK = "pk";
var GPKG_UTR_DFLT_VALUE = "dflt_value";

module.exports = UserTableReader;
