import { Extensions } from './extensions';
import { ColumnValues } from '../dao/columnValues';
import { DBValue } from '../db/dbValue';
import { GeoPackageDao } from '../db/geoPackageDao';
import { ExtensionsKey } from './extensionsKey';
import type { GeoPackage } from '../geoPackage';

/**
 * Extension Data Access Object
 */
export class ExtensionsDao extends GeoPackageDao<Extensions, ExtensionsKey> {
  readonly gpkgTableName: string = Extensions.TABLE_NAME;
  readonly idColumns: string[] = [
    Extensions.COLUMN_TABLE_NAME,
    Extensions.COLUMN_COLUMN_NAME,
    Extensions.COLUMN_EXTENSION_NAME,
  ];

  /**
   * Constructor
   * @param geoPackage GeoPackage object this dao belongs to
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage, Extensions.TABLE_NAME);
  }

  /**
   * Create extensions dao
   * @param geoPackage
   */
  public static createDao(geoPackage: GeoPackage): ExtensionsDao {
    return new ExtensionsDao(geoPackage);
  }

  /**
   * Creates an Extension object from the raw database row
   * @param {object} row raw database row
   * @returns {Extensions}
   */
  createObject(row: Record<string, DBValue>): Extensions {
    const e = new Extensions();
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
   * @returns {Extensions}
   */
  queryByExtension(extensionName: string): Extensions {
    const results = this.queryForAllEq(Extensions.COLUMN_EXTENSION_NAME, extensionName);
    if (!results[0]) return;
    const e = this.createObject(results[0]);
    return e;
  }
  /**
   * Query by extension name and return all results
   * @param {String} extensionName extension name
   * @returns {Extensions[]}
   */
  queryAllByExtension(extensionName: string): Extensions[] {
    const extensions = [];
    for (const row of this.queryForAllEq(Extensions.COLUMN_EXTENSION_NAME, extensionName)) {
      const e = this.createObject(row);
      extensions.push(e);
    }
    return extensions;
  }
  /**
   * Query by extension name and table name and return all results
   * @param {String} extensionName extension name
   * @param {String} tableName table name
   * @returns {Extensions[]}
   */
  queryByExtensionAndTableName(extensionName: string, tableName: string): Extensions[] {
    const values = new ColumnValues();
    values.addColumn(Extensions.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(Extensions.COLUMN_TABLE_NAME, tableName);
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
   * @returns {Extensions[]}
   */
  queryByExtensionAndTableNameAndColumnName(
    extensionName: string,
    tableName: string,
    columnName: string,
  ): Extensions[] {
    const values = new ColumnValues();
    values.addColumn(Extensions.COLUMN_EXTENSION_NAME, extensionName);
    if (tableName !== null && tableName !== undefined) {
      values.addColumn(Extensions.COLUMN_TABLE_NAME, tableName);
    }
    if (columnName !== null && columnName !== undefined) {
      values.addColumn(Extensions.COLUMN_COLUMN_NAME, columnName);
    }
    const extensions = [];
    for (const row of this.queryForFieldValues(values)) {
      const e = this.createObject(row);
      extensions.push(e);
    }
    return extensions;
  }

  /**
   * Deletes all extension entries with this name
   * @param {String} extensionName extension name to delete
   * @returns {Number} Number of extensions deleted
   */
  deleteByExtension(extensionName: string): number {
    const values = new ColumnValues();
    values.addColumn(Extensions.COLUMN_EXTENSION_NAME, extensionName);
    return this.deleteWhere(this.buildWhere(values, '='), this.buildWhereArgs(values));
  }
  /**
   * Deletes all extension entries with this table name
   * @param {String} tableName extension name to delete
   * @returns {Number} Number of extensions deleted
   */
  deleteByTableName(tableName: string): number {
    const values = new ColumnValues();
    values.addColumn(Extensions.COLUMN_TABLE_NAME, tableName);
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
    values.addColumn(Extensions.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(Extensions.COLUMN_TABLE_NAME, tableName);
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
    values.addColumn(Extensions.COLUMN_EXTENSION_NAME, extensionName);
    values.addColumn(Extensions.COLUMN_TABLE_NAME, tableName);
    values.addColumn(Extensions.COLUMN_COLUMN_NAME, columnName);
    return this.deleteWhere(this.buildWhere(values, 'and'), this.buildWhereArgs(values));
  }

  /**
   * Query using the key
   * @param key
   */
  queryForIdWithKey(key: ExtensionsKey): Extensions {
    let extensions = null;
    const results = this.queryByExtensionAndTableNameAndColumnName(
      key.getExtensionName(),
      key.getTableName(),
      key.getColumnName(),
    );
    if (results.length > 0) {
      extensions = results[0];
    }
    return extensions;
  }
}
