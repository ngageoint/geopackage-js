import { Dao } from '../dao/dao';
import { SQLiteMaster } from './master/sqliteMaster';
import { GeoPackageException } from '../geoPackageException';
import { GeoPackage } from '../geoPackage';
import { GeoPackageConnection } from './geoPackageConnection';

/**
 * Abstract GeoPackage DAO
 * @param <T> The class that the code will be operating on.
 */
export abstract class GeoPackageDao<T, ID> extends Dao<T, ID> {
  /**
   * Constructor
   * @param db GeoPackageConnection object
   * @param tableName tableName
   */
  constructor(db: GeoPackageConnection, tableName?: string) {
    super(db, tableName);
  }

  /**
   * {@inheritDoc}
   * <p>
   * Check if the DAO is backed by a table or a view
   *
   * @return true if a table or view exists
   */
  public isTableExists(): boolean {
    return this.isTableOrView();
  }

  /**
   * Check if the DAO is backed by a table or a view
   *
   * @return true if a table or view exists
   */
  public isTableOrView(): boolean {
    return this.isTable() || this.isView();
  }

  /**
   * Check if the DAO is backed by a table
   *
   * @return true if a table exists
   */
  public isTable(): boolean {
    let table;
    try {
      table = super.isTableExists();
    } catch (e) {
      throw new GeoPackageException('Failed to determine if a table: ' + this.getTableName());
    }
    return table;
  }

  /**
   * Check if the DAO is backed by a view
   *
   * @return true if a view exists
   */
  public isView(): boolean {
    return SQLiteMaster.countViewsOnTable(this.db, this.getTableName()) > 0;
  }

  /**
   * Verify the DAO is backed by a table or view
   *
   */
  public verifyExists(): void {
    if (!this.isTableOrView()) {
      throw new GeoPackageException('Table or view does not exist for: ' + this.getTableName());
    }
  }

  /**
   * Check if the table exists
   *
   * @param tableName
   *            table name
   * @return true if exists
   */
  public tableExists(tableName: string): boolean {
    return this.db.tableExists(tableName);
  }

  /**
   * Check if the view exists
   *
   * @param viewName
   *            view name
   * @return true if exists
   */
  public viewExists(viewName: string): boolean {
    return this.db.viewExists(viewName);
  }

  /**
   * Check if a table or view exists with the name
   *
   * @param name
   *            table or view name
   * @return true if exists
   */
  public tableOrViewExists(name: string): boolean {
    return this.db.tableOrViewExists(name);
  }
}
