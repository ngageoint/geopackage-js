import { GeoPackage } from '../geoPackage';
import { GeoPackageConnection } from '../db/geoPackageConnection';
import { Extension } from './extension';
import { ExtensionDao } from './extensionDao';
/**
 * Base Extension
 */

/**
 * Abstract base GeoPackage extension
 */
export abstract class BaseExtension {
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
  extensionName: string;
  /**
   * Definition for the extension
   */
  extensionDefinition: string;
  /**
   * extension table name
   */
  tableName: string;

  /**
   *
   * @param geoPackage GeoPackage object
   */
  constructor(public readonly geoPackage: GeoPackage) {
    this.connection = geoPackage.connection;
    this.extensionsDao = geoPackage.extensionDao;
  }
  /**
   * Get the extension or create as needed
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @param  {String}   definition    extension definition
   * @param  {String}   scopeType     extension scope type
   * @return {Extension}
   */
  getOrCreate(
    extensionName: string,
    tableName: string | null,
    columnName: string | null,
    definition: string,
    scopeType: string,
  ): Extension {
    const extension = this.getExtension(extensionName, tableName, columnName);
    if (extension.length) {
      return extension[0];
    }
    this.extensionsDao.createTable();
    this.createExtension(extensionName, tableName, columnName, definition, scopeType);
    return this.getExtension(extensionName, tableName, columnName)[0];
  }
  /**
   * Get the extension for the name, table name and column name
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @return {Extension[]}
   */
  getExtension(extensionName: string, tableName: string | null, columnName: string | null): Extension[] {
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
  hasExtension(extensionName: string, tableName: string, columnName: string): boolean {
    return !!this.getExtension(extensionName, tableName, columnName).length;
  }

  hasExtensions(extensionName: string): boolean {
    return this.extensionsDao.queryAllByExtension(extensionName).length !== 0;
  }

  /**
   * Create the extension
   * @param {string} extensionName
   * @param {string} tableName
   * @param {string} columnName
   * @param {string} definition
   * @param {string} scopeType
   */
  createExtension(
    extensionName: string,
    tableName: string,
    columnName: string,
    definition: string,
    scopeType: string,
  ): number {
    const extension = new Extension();
    extension.table_name = tableName;
    extension.column_name = columnName;
    extension.extension_name = extensionName;
    extension.definition = definition;
    extension.scope = scopeType;
    return this.extensionsDao.create(extension);
  }
}
