import { GeoPackageTableCreator } from '../../../db/geoPackageTableCreator';
import { GeoPackage } from '../../../geoPackage';
import { FeatureTileTableLinker } from './featureTileTableLinker';

/**
 * Feature Tile Link Extension Table Creator
 */
export class FeatureTileLinkTableCreator extends GeoPackageTableCreator {
  /**
   * Constructor
   * @param geoPackage GeoPackage
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }

  /**
   * {@inheritDoc}
   */
  public getAuthor(): string {
    return FeatureTileTableLinker.EXTENSION_AUTHOR;
  }

  /**
   * {@inheritDoc}
   */
  public getName(): string {
    return FeatureTileTableLinker.EXTENSION_NAME_NO_AUTHOR;
  }

  /**
   * Create Feature Tile Link table
   *
   * @return executed statements
   */
  public createFeatureTileLink(): boolean {
    return this.execScript('feature_tile_link');
  }
}
