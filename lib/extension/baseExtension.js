/**
 * Base Extension
 */

var Extension = require('./extension');
/**
 * Abstract base GeoPackage extension
 * @class
 */
class BaseExtension {
  /**
   * @param {module:geoPackage~GeoPackage} geoPackage
   */
  constructor(geoPackage) {
    this.geoPackage = geoPackage;
    this.connection = geoPackage.connection;
    this.extensionsDao = geoPackage.getExtensionDao();
  }
  /**
   * Get the extension or create as needed
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @param  {String}   definition    extension definition
   * @param  {String}   scopeType     extension scope type
   * @return {Promise<Extension>}
   */
  getOrCreate(extensionName, tableName, columnName, definition, scopeType) {
    var extension = this.getExtension(extensionName, tableName, columnName);
    if (extension.length) {
      return Promise.resolve(extension[0]);
    }
    return this.extensionsDao.createTable()
      .then(function () {
        return this.createExtension(extensionName, tableName, columnName, definition, scopeType);
      }.bind(this));
  }
  /**
   * Get the extension for the name, table name and column name
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @return {Extension[]}
   */
  getExtension(extensionName, tableName, columnName) {
    if (!this.extensionsDao.isTableExists()) {
      return [];
    }
    return this.extensionsDao.queryByExtensionAndTableNameAndColumnName(extensionName, tableName, columnName);
  }
  /**
   * Determine if the GeoPackage has the extension
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @returns {Boolean} if the extension exists
   */
  hasExtension(extensionName, tableName, columnName) {
    return !!this.getExtension(extensionName, tableName, columnName).length;
  }
  
  /**
   * @param {string} extensionName
   * @param {string} tableName
   * @param {string} columnName
   * @param {string} definition
   * @param {string} scopeType
   */
  createExtension(extensionName, tableName, columnName, definition, scopeType) {
    var extension = new Extension();
    extension.table_name = tableName;
    extension.column_name = columnName;
    extension.extension_name = extensionName;
    extension.definition = definition;
    extension.scope = scopeType;
    return this.extensionsDao.create(extension);
  }
}

module.exports = BaseExtension;
