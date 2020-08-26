import { Extension } from './extension';
import { Dao } from '../dao/dao';
import { ColumnValues } from '../dao/columnValues';
import { TableCreator } from '../db/tableCreator';
import { DBValue } from '../db/dbAdapter';

/**
 * Extension Data Access Object
 * @class
 * @extends Dao
 */
export class ExtensionDao extends Dao<Extension> {
  public static readonly TABLE_NAME: string = 'gpkg_extensions';
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';
  public static readonly COLUMN_COLUMN_NAME: string = 'column_name';
  public static readonly COLUMN_EXTENSION_NAME: string = 'extension_name';
  public static readonly COLUMN_DEFINITION: string = 'definition';
  public static readonly COLUMN_SCOPE: string = 'scope';

  readonly gpkgTableName: string = ExtensionDao.TABLE_NAME;
  readonly idColumns: string[] = [
    ExtensionDao.COLUMN_TABLE_NAME,
    ExtensionDao.COLUMN_COLUMN_NAME,
    ExtensionDao.COLUMN_EXTENSION_NAME,
  ];

  /**
   * Creates an Extension object from the raw database row
   * @param {object} row raw database row
   * @returns {Extension}
   */
  createObject(row: Record<string, DBValue>): Extension {
    const e = new Extension();
    e.table_name = row['table_name'] as string;
    e.column_name = row['column_name'] as string;
    e.extension_name = row['extension_name'] as string;
    e.definition = row['definition'] as string;
    e.scope = row['scope'] as string;
    return e;
  }
  /**
   * Query by extension name and return the first result
   * @param {String} extensionName extension name
   * @returns {Extension}
   */
  queryByExtension(extensionName: string): Extension {
    const results = this.queryForAllEq(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    if (!results[0]) return;
    const e = this.createObject(results[0]);
    return e;
  }
  /**
   * Query by extension name and return all results
   * @param {String} extensionName extension name
   * @returns {Extension[]}
   */
  queryAllByExtension(extensionName: string): Extension[] {
    const extensions = [];
    for (const row of this.queryForAllEq(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName)) {
      const e = this.createObject(row);
      extensions.push(e);
    }
    return extensions;
  }
  /**
   * Query by extension name and table name and return all results
   * @param {String} extensionName extension name
   * @param {String} tableName table name
   * @returns {Extension[]}
   */
  queryByExtensionAndTableName(extensionName: string, tableName: string): Extension[] {
    const values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
    const extensions = [];
    for (const row of this.queryForFieldValues(values)) {
      extensions.push(this.createObject(row));
    }
    return extensions;
  }
  /**
   * Query by extension name and table name and return all results
   * @param {String} extensionName extension name
   * @param {String} tableName table name
   * @param {String} columnName column name
   * @returns {Extension[]}
   */
  queryByExtensionAndTableNameAndColumnName(extensionName: string, tableName: string, columnName: string): Extension[] {
    const values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    if (tableName !== null && tableName !== undefined) {
      values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
    }
    if (columnName !== null && columnName !== undefined) {
      values.addColumn(ExtensionDao.COLUMN_COLUMN_NAME, columnName);
    }
    const extensions = [];
    for (const row of this.queryForFieldValues(values)) {
      const e = this.createObject(row);
      extensions.push(e);
    }
    return extensions;
  }
  /**
   * Creates the extensions table
   */
  createTable(): boolean {
    const tc = new TableCreator(this.geoPackage);
    return tc.createExtensions();
  }
  /**
   * Deletes all extension entries with this name
   * @param {String} extensionName extension name to delete
   * @returns {Number} Number of extensions deleted
   */
  deleteByExtension(extensionName: string): number {
    const values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    return this.deleteWhere(this.buildWhere(values, '='), this.buildWhereArgs(values));
  }
  /**
   * Deletes all extension entries with this name and table name
   * @param {String} extensionName extension name to delete
   * @param {String} tableName table name to delete
   * @returns {Number} Number of extensions deleted
   */
  deleteByExtensionAndTableName(extensionName: string, tableName: string): number {
    const values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
    return this.deleteWhere(this.buildWhere(values, 'and'), this.buildWhereArgs(values));
  }
  /**
   * Deletes all extension entries with this name and table name
   * @param {String} extensionName extension name to delete
   * @param {String} tableName table name to delete
   * @returns {Number} Number of extensions deleted
   */
  deleteByExtensionAndTableNameAndColumnName(extensionName: string, tableName: string, columnName: string): number {
    const values = new ColumnValues();
    values.addColumn(ExtensionDao.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(ExtensionDao.COLUMN_TABLE_NAME, tableName);
    values.addColumn(ExtensionDao.COLUMN_COLUMN_NAME, columnName);
    return this.deleteWhere(this.buildWhere(values, 'and'), this.buildWhereArgs(values));
  }
}
