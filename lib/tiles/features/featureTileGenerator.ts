import { Projection } from '@ngageoint/projections-js';
import { BoundingBox } from '../../boundingBox';
import { GeoPackage } from '../../geoPackage';
import { TileGenerator } from '../tileGenerator';
import { FeatureTiles } from './featureTiles';
import { FeatureTileTableLinker } from '../../extension/nga/link/featureTileTableLinker';
import { GeoPackageTile } from '../geoPackageTile';

/**
 * Creates a set of tiles within a GeoPackage by generating tiles from features
 */
export class FeatureTileGenerator extends TileGenerator {
  /**
   * Feature tiles
   */
  private readonly featureTiles: FeatureTiles;

  /**
   * Flag indicating whether the feature and tile tables should be linked
   */
  private linkTables = true;

  /**
   * Constructor
   * @param geoPackage GeoPackage
   * @param tableName table name
   * @param featureTiles feature tiles
   * @param featureGeoPackage feature GeoPackage if different from the destination
   * @param zoomLevels zoom levels
   * @param projection tiles projection
   */
  public constructor(
    geoPackage: GeoPackage,
    tableName: string,
    featureTiles: FeatureTiles,
    featureGeoPackage: GeoPackage,
    zoomLevels: number[],
    projection: Projection,
  ) {
    super(
      geoPackage,
      tableName,
      FeatureTileGenerator.getBoundingBox(geoPackage, featureTiles, null, projection),
      projection,
      zoomLevels,
    );
    this.featureTiles = featureTiles;
  }

  /**
   * Get the bounding box for the feature tile generator, from the provided
   * and from the feature table
   * @param geoPackage GeoPackage
   * @param featureTiles feature tiles
   * @param boundingBox bounding box
   * @param projection projection
   * @return bounding box
   */
  private static getBoundingBox(
    geoPackage: GeoPackage,
    featureTiles: FeatureTiles,
    boundingBox: BoundingBox,
    projection: Projection,
  ): BoundingBox {
    const tableName = featureTiles.getFeatureDao().getTableName();
    const manualQuery = boundingBox == null;
    const featureBoundingBox = geoPackage.getBoundingBox(tableName, projection, manualQuery);
    if (featureBoundingBox != null) {
      if (boundingBox == null) {
        boundingBox = featureBoundingBox;
      } else {
        boundingBox = boundingBox.overlap(featureBoundingBox);
      }
    }
    if (boundingBox != null) {
      boundingBox = featureTiles.expandBoundingBoxWithProjection(boundingBox, projection);
    }
    return boundingBox;
  }

  /**
   * Is the feature table going to be linked with the tile table? Defaults to
   * true.
   * @return true if tables will be linked upon generation
   */
  public isLinkTables(): boolean {
    return this.linkTables;
  }

  /**
   * Set the link tables flag
   * @param linkTables link tables flag
   */
  public setLinkTables(linkTables: boolean): void {
    this.linkTables = linkTables;
  }

  /**
   * {@inheritDoc}
   */
  protected preTileGeneration(): void {
    // Link the feature and tile table if they are in the same GeoPackage
    const geoPackage = this.getGeoPackage();
    const featureTable = this.featureTiles.getFeatureDao().getTableName();
    const tileTable = this.getTableName();
    if (this.linkTables && geoPackage.isFeatureTable(featureTable) && geoPackage.isTileTable(tileTable)) {
      const linker = new FeatureTileTableLinker(geoPackage);
      linker.link(featureTable, tileTable);
    }
  }

  /**
   * {@inheritDoc}
   */
  protected createTile(z: number, x: number, y: number): Promise<GeoPackageTile> {
    return this.featureTiles.drawTile(x, y, z);
  }
}
