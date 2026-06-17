/**
 * Geometry Index Complex Primary Key including table and column name
 */
export class GeometryIndexKey {
  /**
   * Table name
   */
  private tableName: string;

  /**
   * Geometry id
   */
  private geomId: number;

  /**
   * Constructor
   *
   * @param tableName
   *            table name
   * @param geomId
   *            geom id
   */
  public constructor(tableName: string, geomId: number) {
    this.tableName = tableName;
    this.geomId = geomId;
  }

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.tableName;
  }

  /**
   * Set the table name
   *
   * @param tableName
   *            table name
   */
  public setTableName(tableName: string): void {
    this.tableName = tableName;
  }

  /**
   * Get the geometry id
   *
   * @return geom id
   */
  public getGeomId(): number {
    return this.geomId;
  }

  /**
   * Set the geometry id
   *
   * @param geomId
   *            geom id
   */
  public setGeomId(geomId: number): void {
    this.geomId = geomId;
  }

  /**
   * @inheritDoc
   */
  public toString(): string {
    return this.tableName + ':' + this.geomId;
  }

  /**
   * @inheritDoc
   */
  public equals(obj: GeometryIndexKey): boolean {
    return obj != null && obj.getTableName() === this.getTableName() && obj.getGeomId() === this.getGeomId();
  }
}
