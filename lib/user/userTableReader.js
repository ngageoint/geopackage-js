/**
 * userTableReader module.
 * @module user/userTableReader
 */

var UserColumn = require('./userColumn')
  , UserTable = require('./userTable')
  , DataTypes = require('../db/dataTypes');

/** @class UserTableReader */
var UserTableReader = function(tableName, requiredColumns) {
  this.table_name = tableName;
  this.requiredColumns = requiredColumns;
}

var GPKG_UTR_CID = "cid";
var GPKG_UTR_NAME = "name";
var GPKG_UTR_TYPE = "type";
var GPKG_UTR_NOT_NULL = "notnull";
var GPKG_UTR_PK = "pk";
var GPKG_UTR_DFLT_VALUE = "dflt_value";

/**
 * Read the table
 * @param  {sqlite3} db sqlite3 db connection
 * @param  {Function} callback called with an error if one occurred and the table
 */
UserTableReader.prototype.readTable = function (db) {
  var columnList = [];
  var results = db.all('PRAGMA table_info(\''+this.table_name+'\')');
  for (var i =0; i < results.length; i++) {
    var result = results[i];
    var index = result[GPKG_UTR_CID];
    var name = result[GPKG_UTR_NAME];
    var type = result[GPKG_UTR_TYPE];
    var notNull = result[GPKG_UTR_NOT_NULL] === 1;
    var primarykey = result[GPKG_UTR_PK] === 1;
    var max = undefined;
    if (type && type.lastIndexOf(')') === type.length-1) {
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
  return this.createTableWithNameAndColumns(this.table_name, columnList, this.requiredColumns);
};

UserTableReader.prototype.createColumnWithResults = function(result, index, name, type, max, notNull, defaultValue, primaryKey) {

  var dataType = DataTypes.fromName(type);
  return new UserColumn(index, name, dataType, max, notNull, defaultValue, primaryKey);
}

UserTableReader.prototype.createTableWithNameAndColumns = function (tableName, columns) {
  return new UserTable(tableName, columns);
};

/**
 * The UserTableReader
 * @type {UserTableReader}
 */
module.exports = UserTableReader;
