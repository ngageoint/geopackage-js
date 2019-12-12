import GeoPackage from "../geoPackage";
import GeoPackageConnection from "../db/geoPackageConnection";
import Extension from './extension';
import ExtensionDao from './extensionDao';
/**
 * Base Extension
 */

/**
 * Abstract base GeoPackage extension
 */
export default abstract class BaseExtension {
  /**
   * GeoPackage object
   */
  readonly geoPackage: GeoPackage;
  /**
   * Connecton to the GeoPackage
   */
  protected readonly connection: GeoPackageConnection;
  /**
   * ExtensionDao
   */
  readonly extensionsDao: ExtensionDao;
  /**
   * Name of the extension
   */
  extensionName: String;
  /**
   * Definition for the extension
   */
  extensionDefinition: String;
  /**
   * extension table name
   */
  tableName: String;
  /**
   * @param {module:geoPackage~GeoPackage} geoPackage
   */
  constructor(geoPackage: GeoPackage) {
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
  getOrCreate(extensionName: String, tableName: String | null, columnName: String | null, definition: String, scopeType: String): Promise<Extension> {
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
  getExtension(extensionName: String, tableName: String | null, columnName: String | null): Extension[] {
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
  hasExtension(extensionName: String, tableName: String, columnName: String): Boolean {
    return !!this.getExtension(extensionName, tableName, columnName).length;
  }
  
  /**
   * Create the extension
   * @param {string} extensionName
   * @param {string} tableName
   * @param {string} columnName
   * @param {string} definition
   * @param {string} scopeType
   */
  createExtension(extensionName: String, tableName: String, columnName: String, definition: String, scopeType: String): number {
    var extension = new Extension();
    extension.table_name = tableName;
    extension.column_name = columnName;
    extension.extension_name = extensionName;
    extension.definition = definition;
    extension.scope = scopeType;
    return this.extensionsDao.create(extension);
  }
}