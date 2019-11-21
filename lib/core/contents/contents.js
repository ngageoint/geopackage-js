/**
 * Contents module.
 * @module core/contents
 */

/**
 * The Contents class models rows in the [`gpkg_contents`](https://www.geopackage.org/spec121/index.html#_contents)
 * table.  The contents table stores identifying and descriptive information
 * that an application can display to a user in a menu of geospatial data
 * available in a GeoPackage.
 * @class Contents
 * @see https://www.geopackage.org/spec121/index.html#_contents
 */
class Contents {
  constructor() {
    /**
     * the name of the tiles, or feature table
     * @member {string}
     */
    this.table_name = undefined;
    /**
     * Type of data stored in the table:. “features” per clause Features,
     * “tiles” per clause Tiles, or an implementer-defined value for other data
     * tables per clause in an Extended GeoPackage.
     * @member {string}
     */
    this.data_type = undefined;
    /**
     * A human-readable identifier (e.g. short name) for the table_name content
     * @member {string}
     */
    this.identifier = undefined;
    /**
     * A human-readable description for the table_name content
     * @member {string}
     */
    this.description = undefined;
    /**
     * timestamp value in ISO 8601 format as defined by the strftime function
     * %Y-%m-%dT%H:%M:%fZ format string applied to the current time
     * @member {Date}
     */
    this.last_change = undefined;
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
    /**
     * Unique identifier for each Spatial Reference System within a GeoPackage
     * @member {SRSRef}
     */
    this.srs_id = undefined;
  }
}

module.exports = Contents;
