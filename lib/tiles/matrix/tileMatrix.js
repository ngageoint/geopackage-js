/**
 * Tile Matrix object. Documents the structure of the tile matrix at each zoom
 * level in each tiles table. It allows GeoPackages to contain rectangular as
 * well as square tiles (e.g. for better representation of polar regions). It
 * allows tile pyramids with zoom levels that differ in resolution by factors of
 * 2, irregular intervals, or regular intervals other than factors of 2.
 * @class TileMatrix
 */
class TileMatrix {
  constructor() {
    /**
     * Tile Pyramid User Data Table Name
     * @member {string}
     */
    this.table_name = undefined;
    /**
     * 0 ⇐ zoom_level ⇐ max_level for table_name
     * @member {Number}
     */
    this.zoom_level = undefined;
    /**
     * Number of columns (>= 1) in tile matrix at this zoom level
     * @member {Number}
     */
    this.matrix_width = undefined;
    /**
     * Number of rows (>= 1) in tile matrix at this zoom level
     * @member {Number}
     */
    this.matrix_height = undefined;
    /**
     * Tile width in pixels (>= 1)for this zoom level
     * @member {Number}
     */
    this.tile_width = undefined;
    /**
     * Tile height in pixels (>= 1)for this zoom level
     * @member {Number}
     */
    this.tile_height = undefined;
    /**
     * In t_table_name srid units or default meters for srid 0 (>0)
     * @member {Number}
     */
    this.pixel_x_size = undefined;
    /**
     * In t_table_name srid units or default meters for srid 0 (>0)
     * @member {Number}
     */
    this.pixel_y_size = undefined;
  }
}

TileMatrix.TABLE_NAME = 'tableName';
TileMatrix.ZOOM_LEVEL = 'zoomLevel';
TileMatrix.MATRIX_WIDTH = 'matrixWidth';
TileMatrix.MATRIX_HEIGHT = 'matrixHeight';
TileMatrix.TILE_WIDTH = 'tileWidth';
TileMatrix.TILE_HEIGHT = 'tileHeight';
TileMatrix.PIXEL_X_SIZE = 'pixelXSize';
TileMatrix.PIXEL_Y_SIZE = 'pixelYSize';

module.exports = TileMatrix;
