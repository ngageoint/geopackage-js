/**
 * @module extension/scale
 */
import { BaseExtension } from '../baseExtension';
import { GeoPackage } from '../../geoPackage';
import { Extension } from '../extension';
import { TileScalingDao } from './tileScalingDao';
import { TileScaling } from './tileScaling';

/**
 * Tile Scaling extension
 */
export class TileScalingExtension extends BaseExtension {
  public static readonly EXTENSION_NAME: string = 'nga_tile_scaling';
  public static readonly EXTENSION_AUTHOR: string = 'nga';
  public static readonly EXTENSION_NAME_NO_AUTHOR: string = 'tile_scaling';
  public static readonly EXTENSION_DEFINITION: string =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/tile-scaling.html';

  tileScalingDao: TileScalingDao;
  tableName: string;
  constructor(geoPackage: GeoPackage, tableName: string) {
    super(geoPackage);
    this.tableName = tableName;
    this.tileScalingDao = geoPackage.tileScalingDao;
  }
  /**
   * Get or create the tileScaling id extension
   * @return {Extension}
   */
  getOrCreateExtension(): Extension {
    const extension = this.getOrCreate(
      TileScalingExtension.EXTENSION_NAME,
      this.tableName,
      null,
      TileScalingExtension.EXTENSION_DEFINITION,
      Extension.READ_WRITE,
    );
    this.tileScalingDao.createTable();
    return extension;
  }

  /**
   * Creates or updates a tile scaling row for this table extension.
   * @param tileScaling
   */
  createOrUpdate(tileScaling: TileScaling): number {
    tileScaling.table_name = this.tableName;
    return this.tileScalingDao.createOrUpdate(tileScaling)
  }

  /**
   * Get the TileScalingDao
   * @returns {module:extension/scale.TileScalingDao}
   */
  get dao(): TileScalingDao {
    return this.tileScalingDao;
  }
  has(): boolean {
    return this.hasExtension(TileScalingExtension.EXTENSION_NAME, this.tableName, null) && this.tileScalingDao.isTableExists();
  }
  /**
   * Remove tileScaling id extension
   */
  removeExtension(): void {
    if (this.tileScalingDao.isTableExists()) {
      this.geoPackage.deleteTable(TileScalingDao.TABLE_NAME);
    }
    if (this.extensionsDao.isTableExists()) {
      this.extensionsDao.deleteByExtension(TileScalingExtension.EXTENSION_NAME);
    }
  }
}
