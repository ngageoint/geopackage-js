import { Extensions } from './extensions';
import { ExtensionsDao } from './extensionsDao';
import { ExtensionScopeType } from './extensionScopeType';
import type { GeoPackage } from '../geoPackage';
import type { GeoPackageConnection } from '../db/geoPackageConnection';
import { GeoPackageException } from '../geoPackageException';

/**
 * Abstract base GeoPackage extension
 */
export abstract class BaseExtension {
  /**
   * GeoPackage
   */
  readonly geoPackage: GeoPackage;

  /**
   * Connection to the GeoPackage
   */
  protected readonly connection: GeoPackageConnection;

  /**
   * ExtensionDao
   */
  readonly extensionsDao: ExtensionsDao;
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
  constructor(geoPackage: GeoPackage) {
    this.geoPackage = geoPackage;
    this.connection = geoPackage.getConnection();
    this.extensionsDao = geoPackage.getExtensionsDao();
  }

  /**
   * Get the geopackage
   */
  getGeoPackage(): GeoPackage {
    return this.geoPackage;
  }

  /**
   * Get the extension or create as needed
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @param  {String}   definition    extension definition
   * @param  {String}   scopeType     extension scope type
   * @return {Extensions}
   */
  getOrCreate(
    extensionName: string,
    tableName: string | null,
    columnName: string | null,
    definition: string,
    scopeType: ExtensionScopeType,
  ): Extensions {
    let extension = this.get(extensionName, tableName, columnName);
    if (extension == null) {
      try {
        if (!this.extensionsDao.isTableExists()) {
          this.geoPackage.createExtensionsTable();
        }

        extension = new Extensions();
        extension.setTableName(tableName);
        extension.setColumnName(columnName);
        extension.setExtensionName(extensionName);
        extension.setDefinition(definition);
        extension.setScope(scopeType);

        this.extensionsDao.create(extension);
      } catch (e) {
        console.error(e)
        throw new GeoPackageException(
          "Failed to create '" + extensionName
          + "' extension for GeoPackage: "
          + this.geoPackage.getName() + ", Table Name: "
          + tableName + ", Column Name: " + columnName);
      }
    }
    return extension;
  }

  /**
   * Get the extension for the name, table name and column name
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @return {Extensions[]}
   */
  get(extensionName: string, tableName?: string, columnName?: string): Extensions {
    let extension = null;
    if (this.extensionsDao.isTableExists()) {
      const extensions = this.extensionsDao.queryByExtensionAndTableNameAndColumnName(
        extensionName,
        tableName,
        columnName,
      );
      if (extensions.length > 0) {
        extension = extensions[0];
      }
    }
    return extension;
  }

  /**
   * Get the extension for the name, table name and column name
   * @param  {String}   extensionName extension name
   * @param  {String}   tableName     table name
   * @param  {String}   columnName    column name
   * @return {Extensions[]}
   */
  getExtension(extensionName: string, tableName?: string | null, columnName?: string | null): Extensions[] {
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
    return this.extensionsDao.isTableExists() && this.extensionsDao.queryAllByExtension(extensionName).length !== 0;
  }

  /**
   * Verify the GeoPackage is writable and throw an exception if it is not
   */
  public verifyWritable(): void {
    this.geoPackage.verifyWritable();
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
    const extension = new Extensions();
    extension.setTableName(tableName);
    extension.setColumnName(columnName);
    extension.setExtensionName(extensionName);
    extension.setDefinition(definition);
    extension.setScope(scopeType);
    return this.extensionsDao.create(extension);
  }
}
