import { GeoPackageTableCreator } from '../../../db/geoPackageTableCreator';
import { GeoPackage } from '../../../geoPackage';
import { TileTableScaling } from './tileTableScaling';

/**
 * Tile Scaling Extension Table Creator
 */
export class TileScalingTableCreator extends GeoPackageTableCreator {
  /**
   * Constructor
   *
   * @param geoPackage GeoPackage
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }

  /**
   * {@inheritDoc}
   */
  public getAuthor(): string {
    return TileTableScaling.EXTENSION_AUTHOR;
  }

  /**
   * {@inheritDoc}
   */
  public getName(): string {
    return TileTableScaling.EXTENSION_NAME_NO_AUTHOR;
  }

  /**
   * Create Tile Scaling table
   *
   * @return executed statements
   */
  public createTileScaling(): boolean {
    return this.execScript('tile_scaling');
  }
}
