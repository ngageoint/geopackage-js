/**
 * Metadata module.
 * @module metadata
 * @see module:dao/dao
 */

var Dao = require('../dao/dao')
  , ColumnValues = require('../dao/columnValues');

var util = require('util');

/**
  * Indicates that a particular extension applies to a GeoPackage, a table in a
  * GeoPackage or a column of a table in a GeoPackage. An application that access
  * a GeoPackage can query the gpkg_extensions table instead of the contents of
  * all the user data tables to determine if it has the required capabilities to
  * read or write to tables with extensions, and to “fail fast” and return an
  * error message if it does not.
 * @class Extension
 */
var Extension = function() {

  /**
   * Name of the table that requires the extension. When NULL, the extension
   * is required for the entire GeoPackage. SHALL NOT be NULL when the
   * column_name is not NULL.
   * @member {String}
   */
  this.tableName;

  /**
   * Name of the column that requires the extension. When NULL, the extension
   * is required for the entire table.
   * @member {String}
   */
  this.columnName;

  /**
   * The case sensitive name of the extension that is required, in the form
   * <author>_<extension_name>.
   * @member {String}
   */
  this.extensionName;

  /**
   * Definition of the extension in the form specfied by the template in
   * GeoPackage Extension Template (Normative) or reference thereto.
   * @member {String}
   */
  this.definition;

  /**
   * Indicates scope of extension effects on readers / writers: read-write or
   * write-only in lowercase.
   * @member {String}
   */
  this.scope;
}

Extension.EXTENSION_NAME_DIVIDER = "_";

Extension.READ_WRITE_NAME = "read-write";
Extension.WRITE_ONLY_NAME = "write-only";

Extension.prototype.setExtensionName = function(author, extensionName) {
  this.extension_name = Extension.buildExtensionName(author, extensionName);
};

Extension.prototype.getAuthor = function() {
  return Extension.getAuthorWithExtensionName(this.extension_name);
}

Extension.prototype.getExtensionNameNoAuthor = function() {
  return Extension.getExtensionNameNoAuthor(this.extension_name);
}

Extension.buildExtensionName = function(author, extensionName) {
  return author + Extension.EXTENSION_NAME_DIVIDER + extensionName;
}

Extension.getAuthorWithExtensionName = function(extensionName) {
  return extensionName.split(Extension.EXTENSION_NAME_DIVIDER)[0];
}

Extension.getExtensionNameNoAuthor = function(extensionName) {
  var split = extensionName.split(Extension.EXTENSION_NAME_DIVIDER);
  return split[split.length-1];
}

/**
 * Extension Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
var ExtensionDao = function(connection) {
  Dao.call(this, connection);
};

util.inherits(ExtensionDao, Dao);

ExtensionDao.prototype.createObject = function() {
  return new Extension();
};

ExtensionDao.prototype.queryByExtension = function(extensionName, callback) {
  this.queryForEqWithFieldAndValue(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName, callback);
}

ExtensionDao.prototype.queryByExtensionAndTableName = function(extensionName, tableName, rowCallback, callback) {
  var values = new ColumnValues();
  values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
  values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
  this.queryForFieldValues(values, rowCallback, callback);
}

ExtensionDao.prototype.queryByExtensionAndTableNameAndColumnName = function (extensionName, tableName, columnName, rowCallback, callback) {
  var values = new ColumnValues();
  values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
  values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
  values.addColumn(ExtensionDao.COLUMN_COLUMN_NAME, columnName);
  this.queryForFieldValues(values, rowCallback, callback);
};

ExtensionDao.TABLE_NAME = "gpkg_extensions";
ExtensionDao.COLUMN_TABLE_NAME = "table_name";
ExtensionDao.COLUMN_COLUMN_NAME = "column_name";
ExtensionDao.COLUMN_EXTENSION_NAME = "extension_name";
ExtensionDao.COLUMN_DEFINITION = "definition";
ExtensionDao.COLUMN_SCOPE = "scope";

ExtensionDao.prototype.gpkgTableName = ExtensionDao.TABLE_NAME;
ExtensionDao.prototype.idColumns = [ExtensionDao.COLUMN_TABLE_NAME, ExtensionDao.COLUMN_COLUMN_NAME, ExtensionDao.COLUMN_EXTENSION_NAME];

module.exports.ExtensionDao = ExtensionDao;
module.exports.Extension = Extension;
