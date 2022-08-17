import { Contents } from '../../contents/contents';
import { TileMatrixKey } from './tileMatrixKey';
import { GeoPackageException } from '../../geoPackageException';
import { ContentsDataType } from '../../contents/contentsDataType';

/**
 * Tile Matrix object. Documents the structure of the tile matrix at each zoom
 * level in each tiles table. It allows GeoPackages to contain rectangular as
 * well as square tiles (e.g. for better representation of polar regions). It
 * allows tile pyramids with zoom levels that differ in resolution by factors of
 * 2, irregular intervals, or regular intervals other than factors of 2.
 *
 */
export class TileMatrix {
  /**
   * Table name
   */
  public static readonly TABLE_NAME: string = 'gpkg_tile_matrix';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME: string = Contents.COLUMN_TABLE_NAME;

  /**
   * zoomLevel field name
   */
  public static readonly COLUMN_ZOOM_LEVEL: string = 'zoom_level';

  /**
   * id 1 field name, tableName
   */
  public static readonly COLUMN_ID_1: string = TileMatrix.COLUMN_TABLE_NAME;

  /**
   * id 2 field name, zoomLevel
   */
  public static readonly COLUMN_ID_2: string = TileMatrix.COLUMN_ZOOM_LEVEL;

  /**
   * matrixWidth field name
   */
  public static readonly COLUMN_MATRIX_WIDTH: string = 'matrix_width';

  /**
   * matrixHeight field name
   */
  public static readonly COLUMN_MATRIX_HEIGHT: string = 'matrix_height';

  /**
   * tileWidth field name
   */
  public static readonly COLUMN_TILE_WIDTH: string = 'tile_width';

  /**
   * tileHeight field name
   */
  public static readonly COLUMN_TILE_HEIGHT: string = 'tile_height';

  /**
   * pixelXSize field name
   */
  public static readonly COLUMN_PIXEL_X_SIZE: string = 'pixel_x_size';
  /**
   * pixelYSize field name
   */
  public static readonly COLUMN_PIXEL_Y_SIZE: string = 'pixel_y_size';

  /**
   * Foreign key to Contents by table name
   */
  private contents: Contents;

  /**
   * Tile Pyramid User Data Table Name
   */
  private table_name: string;

  /**
   * 0 ⇐ zoom_level ⇐ max_level for table_name
   */
  private zoom_level: number;

  /**
   * Number of columns (>= 1) in tile matrix at this zoom level
   */
  private matrix_width: number;

  /**
   * Number of rows (>= 1) in tile matrix at this zoom level
   */
  private matrix_height: number;

  /**
   * Tile width in pixels (>= 1)for this zoom level
   */
  private tile_width: number;

  /**
   * Tile height in pixels (>= 1)for this zoom level
   */
  private tile_height: number;

  /**
   * In t_table_name srid units or default meters for srid 0 (>0)
   */
  private pixel_x_size: number;

  /**
   * In t_table_name srid units or default meters for srid 0 (>0)
   */
  private pixel_y_size: number;

  /**
   * Default Constructor
   */
  public constructor();
  public constructor(tileMatrix: TileMatrix);

  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof TileMatrix) {
      const tileMatrix = args[0];
      this.contents = new Contents(tileMatrix.getContents());
      this.table_name = tileMatrix.getTableName();
      this.zoom_level = tileMatrix.getZoomLevel();
      this.matrix_width = tileMatrix.getMatrixWidth();
      this.matrix_height = tileMatrix.getMatrixHeight();
      this.tile_width = tileMatrix.getTileWidth();
      this.tile_height = tileMatrix.getTileHeight();
      this.pixel_x_size = tileMatrix.getPixelXSize();
      this.pixel_y_size = tileMatrix.getPixelYSize();
    }
  }

  /**
   * Get the tile matrix id
   *
   * @return tile matrix key
   */
  public getId(): TileMatrixKey {
    return new TileMatrixKey(this.getTableName(), this.getZoomLevel());
  }

  /**
   * Set the tile matrix id
   *
   * @param id
   *            id
   */
  public setId(id: TileMatrixKey): void {
    this.table_name = id.getTableName();
    this.zoom_level = id.getZoomLevel();
  }

  public getContents(): Contents {
    return this.contents;
  }

  public setContents(contents: Contents): void {
    this.contents = contents;
    if (contents != null) {
      // Verify the Contents have a tiles data type (Spec Requirement 42)
      if (!contents.isTilesTypeOrUnknown()) {
        throw new GeoPackageException(
          'The Contents of a TileMatrix' +
            ' must have a data type of ' +
            ContentsDataType.nameFromType(ContentsDataType.TILES) +
            '. actual type: ' +
            contents.getDataTypeName(),
        );
      }
      this.table_name = contents.getId();
    } else {
      this.table_name = null;
    }
  }

  public getTableName(): string {
    return this.table_name;
  }

  public getZoomLevel(): number {
    return this.zoom_level;
  }

  public setZoomLevel(zoomLevel: number): void {
    this.validateValues(TileMatrix.COLUMN_ZOOM_LEVEL, zoomLevel, true);
    this.zoom_level = zoomLevel;
  }

  public getMatrixWidth(): number {
    return this.matrix_width;
  }

  public setMatrixWidth(matrixWidth: number): void {
    this.validateValues(TileMatrix.COLUMN_MATRIX_WIDTH, matrixWidth, false);
    this.matrix_width = matrixWidth;
  }

  public getMatrixHeight(): number {
    return this.matrix_height;
  }

  public setMatrixHeight(matrixHeight: number): void {
    this.validateValues(TileMatrix.COLUMN_MATRIX_HEIGHT, matrixHeight, false);
    this.matrix_height = matrixHeight;
  }

  public getTileWidth(): number {
    return this.tile_width;
  }

  public setTileWidth(tileWidth: number): void {
    this.validateValues(TileMatrix.COLUMN_TILE_WIDTH, tileWidth, false);
    this.tile_width = tileWidth;
  }

  public getTileHeight(): number {
    return this.tile_height;
  }

  public setTileHeight(tileHeight: number): void {
    this.validateValues(TileMatrix.COLUMN_TILE_HEIGHT, tileHeight, false);
    this.tile_height = tileHeight;
  }

  public getPixelXSize(): number {
    return this.pixel_x_size;
  }

  public setPixelXSize(pixelXSize: number): void {
    this.validateValues(TileMatrix.COLUMN_PIXEL_X_SIZE, pixelXSize, false);
    this.pixel_x_size = pixelXSize;
  }

  public getPixelYSize(): number {
    return this.pixel_y_size;
  }

  public setPixelYSize(pixelYSize: number): void {
    this.validateValues(TileMatrix.COLUMN_PIXEL_Y_SIZE, pixelYSize, false);
    this.pixel_y_size = pixelYSize;
  }

  public setTableName(tableName: string): void {
    this.table_name = tableName;
  }

  /**
   * Validate the long values are greater than 0, or greater than or equal to
   * 0 based upon the allowZero flag
   *
   * @param column
   * @param value
   * @param allowZero
   */
  private validateValues(column: string, value: number, allowZero: boolean): void {
    if (value < 0.0 || (value == 0.0 && !allowZero)) {
      throw new GeoPackageException(
        column + ' value must be greater than ' + (allowZero ? 'or equal to ' : '') + '0: ' + value,
      );
    }
  }
}
