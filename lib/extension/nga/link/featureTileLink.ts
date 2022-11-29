import { FeatureTileLinkKey } from './featureTileLinkKey';

/**
 * Feature Tile Link object, for linking a feature and tile table together
 */
export class FeatureTileLink {
  public static readonly TABLE_NAME = 'nga_feature_tile_link';

  public static readonly COLUMN_FEATURE_TABLE_NAME: string = 'feature_table_name';
  public static readonly COLUMN_TILE_TABLE_NAME: string = 'tile_table_name';

  private feature_table_name: string;
  private tile_table_name: string;

  /**
   * Get the id
   *
   * @return feature tile link key
   */
  public getId(): FeatureTileLinkKey {
    return new FeatureTileLinkKey(this.feature_table_name, this.tile_table_name);
  }

  /**
   * Set the id
   * @param id id
   */
  public setId(id: FeatureTileLinkKey): void {
    this.feature_table_name = id.getFeatureTableName();
    this.tile_table_name = id.getTileTableName();
  }

  /**
   * Get the feature table name
   *
   * @return feature table name
   */
  public getFeatureTableName(): string {
    return this.feature_table_name;
  }

  /**
   * Set the feature table name
   * @param featureTableName feature table name
   */
  public setFeatureTableName(featureTableName: string): void {
    this.feature_table_name = featureTableName;
  }

  /**
   * Get the tile table name
   * @return tile table name
   */
  public getTileTableName(): string {
    return this.tile_table_name;
  }

  /**
   * Set the tile table name
   * @param tileTableName tile table name
   */
  public setTileTableName(tileTableName: string): void {
    this.tile_table_name = tileTableName;
  }
}
