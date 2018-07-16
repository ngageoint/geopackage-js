var Extension = require('./index').Extension
  , ExtensionDao = require('./index').ExtensionDao;
/**
 * Abstract base GeoPackage extension
 */
var BaseExtension = function(connection) {
  this.connection = connection;
  this.extensionsDao = new ExtensionDao(connection);
}

module.exports = BaseExtension;

/**
 * Get the extension or create as needed
 * @param  {String}   extensionName extension name
 * @param  {String}   tableName     table name
 * @param  {String}   columnName    column name
 * @param  {String}   definition    extension definition
 * @param  {String}   scopeType     extension scope type
 * @param  {Function} callback      called with err if one occurred and the extension
 */
BaseExtension.prototype.getOrCreate = function(extensionName, tableName, columnName, definition, scopeType, callback) {
  this.getExtension(extensionName, tableName, columnName, function(err, extension) {
    if (extension) {
      return callback(err, extension);
    }
    var exists = this.extensionsDao.isTableExists();
    if (!exists) {
      this.extensionsDao.createTable()
      .then(function() {
        callback(null, this.createExtension(extensionName, tableName, columnName, definition, scopeType));
      }.bind(this));
    } else {
      callback(null, this.createExtension(extensionName, tableName, columnName, definition, scopeType));
    }
  }.bind(this));
};

/**
 * Get the extension for the name, table name and column name
 * @param  {String}   extensionName extension name
 * @param  {String}   tableName     table name
 * @param  {String}   columnName    column name
 * @param  {Function} callback      Called with err if one occurred and the extension
 */
BaseExtension.prototype.getExtension = function(extensionName, tableName, columnName, callback) {
  if (!this.extensionsDao.isTableExists()) {
    return callback();
  }
  var extension;
  this.extensionsDao.queryByExtensionAndTableNameAndColumnName(extensionName, tableName, columnName, function(err, row) {
    extension = row;
  }, function(err) {
    return callback(err, extension);
  });
};

/**
 * Determine if the GeoPackage has the extension
 * @param  {String}   extensionName extension name
 * @param  {String}   tableName     table name
 * @param  {String}   columnName    column name
 * @param  {Function} callback      called with err if one occurred and a true or false indicating the existence of the extension
 */
BaseExtension.prototype.hasExtension = function(extensionName, tableName, columnName, callback) {

};

BaseExtension.prototype.createExtension = function(extensionName, tableName, columnName, definition, scopeType) {
  var extension = new Extension();
  extension.table_name = tableName;
  extension.column_name = columnName;
  extension.extension_name = extensionName;
  extension.definition = definition;
  extension.scope = scopeType;
  return this.extensionsDao.create(extension);
};
