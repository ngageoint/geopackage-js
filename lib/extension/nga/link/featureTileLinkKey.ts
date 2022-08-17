/**
 * Feature Tile Link Complex Primary Key including feature and tile table names
 */
export class FeatureTileLinkKey {
  /**
   * Feature table name
   */
  private featureTableName: string;

  /**
   * Tile table name
   */
  private tileTableName: string;

  /**
   * Constructor
   * @param featureTableName feature table name
   * @param tileTableName tile table name
   */
  public constructor(featureTableName: string, tileTableName: string) {
    this.featureTableName = featureTableName;
    this.tileTableName = tileTableName;
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
   * @param tileTableName tile table name
   */
  public setTileTableName(tileTableName: string): void {
    this.tileTableName = tileTableName;
  }

  /**
   * {@inheritDoc}
   */
  public toString(): string {
    return this.featureTableName + '-' + this.tileTableName;
  }

  /**
   * {@inheritDoc}
   */
  public equals(obj: FeatureTileLinkKey): boolean {
    return (
      obj.getTileTableName() === this.getTileTableName() && obj.getFeatureTableName() === this.getFeatureTableName()
    );
  }
}
