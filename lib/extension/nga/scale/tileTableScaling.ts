/**
 * @module extension/nga/scale
 */
import { BaseExtension } from '../../baseExtension';
import { GeoPackage } from '../../../geoPackage';
import { Extensions } from '../../extensions';
import { TileScalingDao } from './tileScalingDao';
import { TileScaling } from './tileScaling';
import { ExtensionScopeType } from '../../extensionScopeType';
import { GeoPackageException } from '../../../geoPackageException';
import { TileScalingTableCreator } from './tileScalingTableCreator';
import { NGAExtensions } from '../ngaExtensions';

/**
 * Tile Scaling extension
 */
export class TileTableScaling extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = NGAExtensions.EXTENSION_AUTHOR;

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
    this.tileScalingDao = TileScalingDao.createDao(this.geoPackage.getConnection());
  }
  /**
   * Get or create the tileScaling id extension
   * @return {Extensions}
   */
  getOrCreateExtension(): Extensions {
    const extension = this.getOrCreate(
      TileTableScaling.EXTENSION_NAME,
      this.tableName,
      null,
      TileTableScaling.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
    return extension;
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
          +this.geoPackage.getName() +
          ', Tile Table: ' +
          this.tableName,
      );
    }

    return success;
  }

  /**
   * Get the TileScalingDao
   * @returns {module:extension/nga/scale.TileScalingDao}
   */
  get dao(): TileScalingDao {
    return this.tileScalingDao;
  }
  has(): boolean {
    return (
      this.hasExtension(TileTableScaling.EXTENSION_NAME, this.tableName, null) && this.tileScalingDao.isTableExists()
    );
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
    return TileScalingDao.createDao(this.geoPackage.getConnection());
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
        const tableCreator = new TileScalingTableCreator(this.geoPackage);
        created = tableCreator.createTileScaling();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if TileScaling table exists and create it');
    }

    return created;
  }
}
