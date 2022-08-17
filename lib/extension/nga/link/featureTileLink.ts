import { FeatureTileLinkKey } from './featureTileLinkKey';

/**
 * Feature Tile Link object, for linking a feature and tile table together
 */
export class FeatureTileLink {
  public static readonly EXTENSION_NAME: string = 'nga_feature_tile_link';
  public static readonly COLUMN_FEATURE_TABLE_NAME: string = 'feature_table_name';
  public static readonly COLUMN_TILE_TABLE_NAME: string = 'tile_table_name';
  private featureTableName: string;
  private tileTableName: string;

  /**
   * Get the id
   *
   * @return feature tile link key
   */
  public getId(): FeatureTileLinkKey {
    return new FeatureTileLinkKey(this.featureTableName, this.tileTableName);
  }

  /**
   * Set the id
   * @param id id
   */
  public setId(id: FeatureTileLinkKey): void {
    this.featureTableName = id.getFeatureTableName();
    this.tileTableName = id.getTileTableName();
  }

  /**
   * Get the feature table name
   *
   * @return feature table name
   */
  public getFeatureTableName(): string {
    return this.featureTableName;
  }

  /**
   * Set the feature table name
   *
   * @param featureTableName
   *            feature table name
   */
  public setFeatureTableName(featureTableName: string): void {
    this.featureTableName = featureTableName;
  }

  /**
   * Get the tile table name
   *
   * @return tile table name
   */
  public getTileTableName(): string {
    return this.tileTableName;
  }

  /**
   * Set the tile table name
   *
   * @param tileTableName
   *            tile table name
   */
  public setTileTableName(tileTableName: string): void {
    this.tileTableName = tileTableName;
  }
}
