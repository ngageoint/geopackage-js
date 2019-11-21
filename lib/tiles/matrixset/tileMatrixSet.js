/**
 * @module tiles/matrixset
 * @see module:dao/dao
 */

var BoundingBox = require('../../boundingBox');

/**
 * `TileMatrixSet` models the [`gpkg_tile_matrix_set`](https://www.geopackage.org/spec121/index.html#_tile_matrix_set)
 * table.  A row in this table defines the minimum bounding box (min_x, min_y,
 * max_x, max_y) and spatial reference system (srs_id) for all tiles in a
 * [tile pyramid](https://www.geopackage.org/spec121/index.html#tiles_user_tables)
 * user data table.  While the parent [Contents]{@link module:core/contents~Contents}
 * row/object also defines a bounding box, the tile matrix set bounding box is
 * used as the reference for calculating tile column/row matrix coordinates, so
 * (min_x, max_y) in SRS coordinates would be the upper-left corner of the tile
 * at tile matrix coordinate (0, 0).  The parent `Contents` bounding box may be
 * smaller or larger than the `TileMatrixSet` bounding box, and its purpose is
 * to guide a user-facing application to the target region of the tile pyramid.
 * The [`srs_id`]{@link module:tiles/matrixset~TileMatrixSet#srs_id} of the `TileMatrixSet`, on the other hand, must
 * match that of the parent [`Contents`]{@link module:core/contents~Contents#srs_id}.
 *
 * @class TileMatrixSet
 */
class TileMatrixSet {
  constructor() {
    /**
     * Name of the [tile pyramid user data table](https://www.geopackage.org/spec121/index.html#tiles_user_tables)
     * that stores the tiles
     * @member {string}
     */
    this.table_name = undefined;
    /**
     * Unique identifier for each Spatial Reference System within a GeoPackage
     * @member {SRSRef}
     */
    this.srs_id = undefined;
    /**
     * Bounding box minimum easting or longitude for all content in table_name
     * @member {Number}
     */
    this.min_x = undefined;
    /**
     * Bounding box minimum northing or latitude for all content in table_name
     * @member {Number}
     */
    this.min_y = undefined;
    /**
     * Bounding box maximum easting or longitude for all content in table_name
     * @member {Number}
     */
    this.max_x = undefined;
    /**
     * Bounding box maximum northing or latitude for all content in table_name
     * @member {Number}
     */
    this.max_y = undefined;
  }
  setBoundingBox(boundingBox) {
    this.min_x = boundingBox.minLongitude;
    this.max_x = boundingBox.maxLongitude;
    this.min_y = boundingBox.minLatitude;
    this.max_y = boundingBox.maxLatitude;
  }
  getBoundingBox() {
    return new BoundingBox(this.min_x, this.max_x, this.min_y, this.max_y);
  }
  setContents(contents) {
    if (contents && contents.data_type === 'tiles') {
      this.table_name = contents.table_name;
    }
  }
}

TileMatrixSet.TABLE_NAME = "tableName";
TileMatrixSet.MIN_X = "minX";
TileMatrixSet.MIN_Y = "minY";
TileMatrixSet.MAX_X = "maxX";
TileMatrixSet.MAX_Y = "maxY";
TileMatrixSet.SRS_ID = "srsId";

module.exports = TileMatrixSet;
