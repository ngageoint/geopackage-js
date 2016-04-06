/**
 * userTableReader module.
 * @module user/userTableReader
 */

/** @class UserTableReader */
var UserTableReader = function(tableName) {
  this.tableName = tableName;
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
UserTableReader.prototype.readTable = function (db, callback) {
  var columnList = [];
  db.all('PRAGMA table_info('+this.tableName+')', function(err, results) {
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
      var defaultValueIndex = result[GPKG_UTR_DFLT_VALUE];
      var column = this.createColumnWithResults(result, index, name, type, max, notNull, defaultValueIndex, primarykey);
      columnList.push(column);
    }

    if (columnList.length === 0) {
      return callback(new Error('Table does not exist: ' + this.tableName));
    }
    var table = this.createTableWithNameAndColumns(this.tableName, columnList);
    callback(null, table);
  }.bind(this));
};

/**
 * The UserTableReader
 * @type {UserTableReader}
 */
module.exports = UserTableReader;
