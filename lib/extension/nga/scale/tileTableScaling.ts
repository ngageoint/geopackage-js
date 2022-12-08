import { BaseExtension } from '../../baseExtension';
import { Extensions } from '../../extensions';
import { TileScalingDao } from './tileScalingDao';
import { TileScaling } from './tileScaling';
import { ExtensionScopeType } from '../../extensionScopeType';
import { GeoPackageException } from '../../../geoPackageException';
import { GeoPackageTableCreator } from '../../../db/geoPackageTableCreator';
import { NGAExtensionsConstants } from '../ngaExtensionsConstants';
import type { GeoPackage } from '../../../geoPackage';

/**
 * Tile Scaling extension
 */
export class TileTableScaling extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = NGAExtensionsConstants.EXTENSION_AUTHOR;

  /**
   * Extension name without the author
   */
  public static readonly EXTENSION_NAME_NO_AUTHOR = 'tile_scaling';

  /**
   * Extension, with author and name
   */
  public static readonly EXTENSION_NAME = Extensions.buildExtensionName(
    TileTableScaling.EXTENSION_AUTHOR,
    TileTableScaling.EXTENSION_NAME_NO_AUTHOR,
  );

  /**
   * Extension definition URL
   */
  public static readonly EXTENSION_DEFINITION =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/tile-scaling.html';

  tileScalingDao: TileScalingDao;
  tableName: string;
  constructor(geoPackage: GeoPackage, tableName: string) {
    super(geoPackage);
    this.tableName = tableName;
    this.tileScalingDao = this.geoPackage.getTileScalingDao();
  }
  /**
   * Get or create the tileScaling id extension
   * @return {Extensions}
   */
  getOrCreateExtension(): Extensions {
    return this.getOrCreate(
      TileTableScaling.EXTENSION_NAME,
      this.tableName,
      null,
      TileTableScaling.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
  }

  /**
   * Create the tile scaling (same as calling
   * {@link #createOrUpdate(TileScaling)})
   * @param tileScaling tile scaling
   * @return true upon success
   */
  public create(tileScaling: TileScaling): boolean {
    return this.createOrUpdate(tileScaling);
  }

  /**
   * Update the tile scaling (same as calling
   * {@link #createOrUpdate(TileScaling)})
   * @param tileScaling tile scaling
   * @return true upon success
   */
  public update(tileScaling: TileScaling): boolean {
    return this.createOrUpdate(tileScaling);
  }

  /**
   * Creates or updates a tile scaling row for this table extension.
   * @param tileScaling
   */
  createOrUpdate(tileScaling: TileScaling): boolean {
    let success = false;
    tileScaling.setTableName(this.tableName);

    this.getOrCreateExtension();
    try {
      if (!this.tileScalingDao.isTableExists()) {
        this.createTileScalingTable();
      }

      const status = this.tileScalingDao.createOrUpdate(tileScaling);
      success = status.isCreated() || status.isUpdated();
    } catch (e) {
      throw new GeoPackageException(
        'Failed to create or update tile scaling for GeoPackage: ' +
          + this.geoPackage.getName() +
          ', Tile Table: ' +
          this.tableName,
      );
    }

    return success;
  }

  /**
   * Get the TileScalingDao
   * @returns {TileScalingDao}
   */
  get dao(): TileScalingDao {
    return this.tileScalingDao;
  }

  /**
   * Get the tile scaling
   * @return tile scaling
   */
  public getTileScaling(): TileScaling {
    let tileScaling = null;
    if (this.has()) {
      try {
        tileScaling = this.tileScalingDao.queryForId(this.tableName);
      } catch (e) {
        throw new GeoPackageException(
          "Failed to query for tile scaling for GeoPackage: "
          + this.geoPackage.getName() + ", Tile Table: "
          + this.tableName);
      }
    }
    return tileScaling;
  }

  /**
   * Checks if this GeoPackage has the tile scaling extension
   */
  has(): boolean {
    let exists = false;
    try {
      exists = this.hasExtension(TileTableScaling.EXTENSION_NAME, this.tableName, null)
        && this.tileScalingDao.isTableExists()
        && this.tileScalingDao.idExists(this.tableName);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to check for tile scaling for GeoPackage: "
        + this.geoPackage.getName() + ", Tile Table: "
        + this.tableName);
    }
    return exists;
  }

  /**
   * Delete the tile table scaling for the tile table
   *
   * @return true if deleted
   */
  public delete(): boolean {

    let deleted = false;

    try {
      if (this.tileScalingDao.isTableExists()) {
        deleted = this.tileScalingDao.deleteById(this.tableName) > 0;
      }
      if (this.extensionsDao.isTableExists()) {
        deleted = this.extensionsDao.deleteByExtensionAndTableName(TileTableScaling.EXTENSION_NAME, this.tableName) > 0 || deleted;
      }
    } catch (e) {
      throw new GeoPackageException(
        "Failed to delete tile table scaling for GeoPackage: "
        + this.geoPackage.getName() + ", Table: " + this.tableName);
    }

    return deleted;
  }

  /**
   * Remove tileScaling id extension
   */
  removeExtension(): void {
    if (this.tileScalingDao.isTableExists()) {
      this.geoPackage.deleteTable(TileScaling.TABLE_NAME);
    }
    if (this.extensionsDao.isTableExists()) {
      this.extensionsDao.deleteByExtension(TileTableScaling.EXTENSION_NAME);
    }
  }

  /**
   * Get a Tile Scaling DAO
   * @return tile scaling dao
   */
  public getTileScalingDao(): TileScalingDao {
    return this.geoPackage.getTileScalingDao();
  }

  /**
   * Create the Tile Scaling Table if it does not exist
   *
   * @return true if created
   */
  public createTileScalingTable(): boolean {
    this.verifyWritable();
    let created = false;
    try {
      if (!this.tileScalingDao.isTableExists()) {
        const tableCreator = new GeoPackageTableCreator(this.geoPackage);
        created = tableCreator.execScript('tile_scaling');
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if TileScaling table exists and create it');
    }

    return created;
  }
}
