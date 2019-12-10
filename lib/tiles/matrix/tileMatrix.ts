/**
 * Tile Matrix object. Documents the structure of the tile matrix at each zoom
 * level in each tiles table. It allows GeoPackages to contain rectangular as
 * well as square tiles (e.g. for better representation of polar regions). It
 * allows tile pyramids with zoom levels that differ in resolution by factors of
 * 2, irregular intervals, or regular intervals other than factors of 2.
 * @class TileMatrix
 */
export class TileMatrix {
  public static readonly TABLE_NAME = 'tableName';
  public static readonly ZOOM_LEVEL = 'zoomLevel';
  public static readonly MATRIX_WIDTH = 'matrixWidth';
  public static readonly MATRIX_HEIGHT = 'matrixHeight';
  public static readonly TILE_WIDTH = 'tileWidth';
  public static readonly TILE_HEIGHT = 'tileHeight';
  public static readonly PIXEL_X_SIZE = 'pixelXSize';
  public static readonly PIXEL_Y_SIZE = 'pixelYSize';

  /**
   * Tile Pyramid User Data Table Name
   * @member {string}
   */
  table_name: string;
  /**
   * 0 ⇐ zoom_level ⇐ max_level for table_name
   * @member {Number}
   */
  zoom_level: number;
  /**
   * Number of columns (>= 1) in tile matrix at this zoom level
   * @member {Number}
   */
  matrix_width: number;
  /**
   * Number of rows (>= 1) in tile matrix at this zoom level
   * @member {Number}
   */
  matrix_height: number;
  /**
   * Tile width in pixels (>= 1)for this zoom level
   * @member {Number}
   */
  tile_width: number;
  /**
   * Tile height in pixels (>= 1)for this zoom level
   * @member {Number}
   */
  tile_height: number;
  /**
   * In t_table_name srid units or default meters for srid 0 (>0)
   * @member {Number}
   */
  pixel_x_size: number;
  /**
   * In t_table_name srid units or default meters for srid 0 (>0)
   * @member {Number}
   */
  pixel_y_size: number;

}
