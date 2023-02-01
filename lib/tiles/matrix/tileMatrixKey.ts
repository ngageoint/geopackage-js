/**
 * Tile Matrix complex primary key
 */
export class TileMatrixKey {
  /**
   * Table name
   */
  private tableName: string;

  /**
   * Zoom level
   */
  private zoomLevel: number;

  /**
   * Constructor
   *
   * @param tableName
   *            table name
   * @param zoomLevel
   *            zoom level
   */
  public constructor(tableName: string, zoomLevel: number) {
    this.tableName = tableName;
    this.zoomLevel = zoomLevel;
  }

  public getTableName(): string {
    return this.tableName;
  }

  public setTableName(tableName: string): void {
    this.tableName = tableName;
  }

  public getZoomLevel(): number {
    return this.zoomLevel;
  }

  public setZoomLevel(zoomLevel: number): void {
    this.zoomLevel = zoomLevel;
  }

  /**
   * @inheritDoc
   */
  public toString(): string {
    return this.tableName + ':' + this.zoomLevel;
  }

  /**
   * @inheritDoc
   */
  public equals(obj: TileMatrixKey): boolean {
    return this.getTableName() === obj.getTableName() && this.getZoomLevel() === obj.getZoomLevel();
  }
}
