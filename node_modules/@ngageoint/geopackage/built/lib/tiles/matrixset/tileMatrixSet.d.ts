/**
 * @module tiles/matrixset
 * @see module:dao/dao
 */
import { BoundingBox } from '../../boundingBox';
import { Contents } from '../../core/contents/contents';
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
export declare class TileMatrixSet {
    static readonly TABLE_NAME: string;
    static readonly MIN_X: string;
    static readonly MIN_Y: string;
    static readonly MAX_X: string;
    static readonly MAX_Y: string;
    static readonly SRS_ID: string;
    /**
     * Name of the [tile pyramid user data table](https://www.geopackage.org/spec121/index.html#tiles_user_tables)
     * that stores the tiles
     * @member {string}
     */
    table_name: string;
    /**
     * Unique identifier for each Spatial Reference System within a GeoPackage
     * @member {SRSRef}
     */
    srs_id: number;
    /**
     * Bounding box minimum easting or longitude for all content in table_name
     * @member {Number}
     */
    min_x: number;
    /**
     * Bounding box minimum northing or latitude for all content in table_name
     * @member {Number}
     */
    min_y: number;
    /**
     * Bounding box maximum easting or longitude for all content in table_name
     * @member {Number}
     */
    max_x: number;
    /**
     * Bounding box maximum northing or latitude for all content in table_name
     * @member {Number}
     */
    max_y: number;
    set boundingBox(boundingBox: BoundingBox);
    get boundingBox(): BoundingBox;
    set contents(contents: Contents);
}
