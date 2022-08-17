/**
 * @memberOf module:extension/nga/scale
 * @class TileScaling
 */
import { TileScalingType } from './tileScalingType';
import { TileMatrixSet } from '../../../tiles/matrixset/tileMatrixSet';

/**
 * Tile Scaling object, for scaling tiles from nearby zoom levels for missing
 * @constructor
 */
export class TileScaling {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'nga_tile_scaling';

  /**
   * tableName column
   */
  public static readonly COLUMN_TABLE_NAME = 'table_name';

  /**
   * scalingType field name
   */
  public static readonly COLUMN_SCALING_TYPE = 'scaling_type';

  /**
   * zoomIn field name
   */
  public static readonly COLUMN_ZOOM_IN = 'zoom_in';

  /**
   * zoomOut field name
   */
  public static readonly COLUMN_ZOOM_OUT = 'zoom_out';

  /**
   * Foreign key to table_name in gpkg_tile_matrix_set
   */
  private table_name: string;

  /**
   * Tile Scaling behavior type
   */
  private scaling_type: string;

  /**
   * Max zoom levels in to search
   */
  private zoom_in: number;

  /**
   * Max zoom levels out to search
   */
  private zoom_out: number;

  /**
   * Default Constructor
   */
  public constructor();

  /**
   * Constructor
   * @param tileMatrixSet tile matrix set
   * @param scalingType scaling type
   * @param zoomIn max zoom in levels
   * @param zoomOut max zoom out levels
   */
  public constructor(tileMatrixSet: TileMatrixSet, scalingType: TileScalingType, zoomIn: number, zoomOut: number);

  /**
   * Constructor
   * @param tableName table name
   * @param scalingType scaling type
   * @param zoomIn max zoom in levels
   * @param zoomOut max zoom out levels
   */
  public constructor(tableName: string, scalingType: TileScalingType, zoomIn: number, zoomOut: number);

  /**
   * Constructor
   * @param scalingType scaling type
   * @param zoomIn  max zoom in levels
   * @param zoomOut max zoom out levels
   */
  public constructor(scalingType: TileScalingType, zoomIn: number, zoomOut: number);

  /**
   * Copy Constructor
   * @param tileScaling tile scaling to copy
   */
  public constructor(tileScaling: TileScaling);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 4) {
      if (args[0] instanceof TileMatrixSet) {
        this.setTileMatrixSet(args[0]);
        this.setScalingType(args[1]);
        this.zoom_in = args[2];
        this.zoom_out = args[3];
      } else if (typeof args[0] === 'string') {
        this.table_name = args[0];
        this.setScalingType(args[1]);
        this.zoom_in = args[2];
        this.zoom_out = args[3];
      }
    } else if (args.length === 3) {
      this.setScalingType(args[0]);
      this.zoom_in = args[1];
      this.zoom_out = args[2];
    } else if (args.length === 1) {
      const tileScaling = args[0];
      this.table_name = tileScaling.tableName;
      this.scaling_type = tileScaling.scalingType;
      this.zoom_in = tileScaling.zoomIn;
      this.zoom_out = tileScaling.zoomOut;
    }
  }

  /**
   * Set the tile matrix set
   * @param tileMatrixSet tile matrix set
   */
  public setTileMatrixSet(tileMatrixSet: TileMatrixSet): void {
    this.setTableName(tileMatrixSet != null ? tileMatrixSet.getTableName() : null);
  }

  /**
   * Get the table name of the tile table
   * @return table name of the tile table
   */
  public getTableName(): string {
    return this.table_name;
  }

  /**
   * Set the table name of the tile table
   * @param tableName table name of the tile table
   */
  public setTableName(tableName: string): void {
    this.table_name = tableName;
  }

  /**
   * Get the tile scaling type
   * @return tile scaling type
   */
  public getScalingType(): TileScalingType {
    return TileScalingType.fromName(this.scaling_type);
  }

  /**
   * Set the tile scaling type
   * @param scalingType tile scaling type
   */
  public setScalingType(scalingType: TileScalingType): void {
    this.scaling_type = TileScalingType.nameFromType(scalingType);
  }

  /**
   * Set the tile scaling type
   * @param scalingType tile scaling type
   */
  public setScalingTypeWithString(scalingType: string): void {
    this.scaling_type = scalingType;
  }

  /**
   * Get the tile scaling type string value
   * @return tile scaling type string
   */
  public getScalingTypeString(): string {
    return this.scaling_type;
  }

  /**
   * Set the tile scaling type string value
   * @param scalingType tile scaling type string
   */
  public setScalingTypeString(scalingType: string): void {
    this.scaling_type = scalingType;
  }

  /**
   * Get the max levels to zoom in
   * @return zoom in levels
   */
  public getZoomIn(): number {
    return this.zoom_in;
  }

  /**
   * Set the max levels to zoom in
   * @param zoomIn zoom in levels
   */
  public setZoomIn(zoomIn: number): void {
    this.zoom_in = zoomIn;
  }

  /**
   * Get the max levels to zoom out
   * @return zoom out levels
   */
  public getZoomOut(): number {
    return this.zoom_out;
  }

  /**
   * Set the max levels to zoom out
   * @param zoomOut zoom out level
   */
  public setZoomOut(zoomOut: number): void {
    this.zoom_out = zoomOut;
  }

  /**
   * Is zoom in tile search enabled
   *
   * @return true if zoom in for tiles is allowed
   */
  public isZoomIn(): boolean {
    return (
      (this.zoom_in == null || this.zoom_out > 0) &&
      this.scaling_type != null &&
      this.getScalingType() != TileScalingType.OUT
    );
  }

  /**
   * Is zoom out tile search enabled
   *
   * @return true if zoom out for tiles is allowed
   */
  public isZoomOut(): boolean {
    return (
      (this.zoom_in == null || this.zoom_out > 0) &&
      this.scaling_type != null &&
      this.getScalingType() != TileScalingType.IN
    );
  }
}
