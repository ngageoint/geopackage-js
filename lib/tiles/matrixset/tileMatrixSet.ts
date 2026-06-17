import { BoundingBox } from '../../boundingBox';
import { Contents } from '../../contents/contents';
import { SpatialReferenceSystemConstants } from '../../srs/spatialReferenceSystemConstants';

/**
 * Tile Matrix Set object. Defines the minimum bounding box (min_x, min_y,
 * max_x, max_y) and spatial reference system (srs_id) for all content in a tile
 * pyramid user data table.
 *
 * @class TileMatrixSet
 */
export class TileMatrixSet {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'gpkg_tile_matrix_set';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME = Contents.COLUMN_TABLE_NAME;

  /**
   * id field name, tableName
   */
  public static readonly COLUMN_ID = TileMatrixSet.COLUMN_TABLE_NAME;

  /**
   * srsId field name
   */
  public static readonly COLUMN_SRS_ID = SpatialReferenceSystemConstants.COLUMN_SRS_ID;

  /**
   * minX field name
   */
  public static readonly COLUMN_MIN_X = 'min_x';

  /**
   * minY field name
   */
  public static readonly COLUMN_MIN_Y = 'min_y';

  /**
   * maxX field name
   */
  public static readonly COLUMN_MAX_X = 'max_x';

  /**
   * maxY field name
   */
  public static readonly COLUMN_MAX_Y = 'max_y';

  /**
   * Tile Pyramid User Data Table Name
   */
  private table_name: string;

  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   */
  private srs_id: number;

  /**
   * Bounding box minimum easting or longitude for all content in table_name
   */
  private min_x: number;

  /**
   * Bounding box minimum northing or latitude for all content in table_name
   */
  private min_y: number;

  /**
   * Bounding box maximum easting or longitude for all content in table_name
   */
  private max_x: number;

  /**
   * Bounding box maximum northing or latitude for all content in table_name
   */
  private max_y: number;

  /**
   * Constructor
   * @param tileMatrixSet tile matrix set to copy
   */
  public constructor(tileMatrixSet?: TileMatrixSet) {
    if (tileMatrixSet != null) {
      this.table_name = tileMatrixSet.getTableName();
      this.srs_id = tileMatrixSet.getSrsId();
      this.min_x = tileMatrixSet.getMinX();
      this.min_y = tileMatrixSet.getMinY();
      this.max_x = tileMatrixSet.getMaxX();
      this.max_y = tileMatrixSet.getMaxY();
    }
  }

  public getId(): string {
    return this.table_name;
  }

  public setId(id: string): void {
    this.table_name = id;
  }

  public getTableName(): string {
    return this.table_name;
  }

  public setTableName(tableName: string): void {
    this.table_name = tableName;
  }

  public getSrsId(): number {
    return this.srs_id;
  }

  public setSrsId(srsId: number): void {
    this.srs_id = srsId;
  }

  public getMinX(): number {
    return this.min_x;
  }

  public setMinX(minX: number): void {
    this.min_x = minX;
  }

  public getMinY(): number {
    return this.min_y;
  }

  public setMinY(minY: number): void {
    this.min_y = minY;
  }

  public getMaxX(): number {
    return this.max_x;
  }

  public setMaxX(maxX: number): void {
    this.max_x = maxX;
  }

  public getMaxY(): number {
    return this.max_y;
  }

  public setMaxY(maxY: number): void {
    this.max_y = maxY;
  }

  /**
   * Get a bounding box
   *
   * @return bounding box
   */
  public getBoundingBox(): BoundingBox {
    return new BoundingBox(this.getMinX(), this.getMinY(), this.getMaxX(), this.getMaxY());
  }

  /**
   * Set a bounding box
   *
   * @param boundingBox
   *            bounding box
   */
  public setBoundingBox(boundingBox: BoundingBox): void {
    this.setMinX(boundingBox.getMinLongitude());
    this.setMaxX(boundingBox.getMaxLongitude());
    this.setMinY(boundingBox.getMinLatitude());
    this.setMaxY(boundingBox.getMaxLatitude());
  }
}
