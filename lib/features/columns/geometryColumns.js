

/**
 * Spatial Reference System object. The coordinate reference system definitions it contains are referenced by the GeoPackage Contents and GeometryColumns objects to relate the vector and tile data in user tables to locations on the earth.
 * @class GeometryColumns
 */
class GeometryColumns {
  constructor() {
    /**
       * Name of the table containing the geometry column
       * @member {string}
       */
    this.table_name = undefined;
    /**
     * Name of a column in the feature table that is a Geometry Column
     * @member {string}
     */
    this.column_name = undefined;
    /**
     * Name from Geometry Type Codes (Core) or Geometry Type Codes (Extension)
     * in Geometry Types (Normative)
     * @member {string}
     */
    this.geometry_type_name = undefined;
    /**
     * Spatial Reference System ID: gpkg_spatial_ref_sys.srs_id
     * @member {module:dao/spatialReferenceSystem~SpatialReferenceSystem}
     */
    this.srs = undefined;
    /**
     * Unique identifier for each Spatial Reference System within a GeoPackage
     * @member {Number}
     */
    this.srs_id = undefined;
    /**
     * 0: z values prohibited; 1: z values mandatory; 2: z values optional
     * @member {byte}
     */
    this.z = undefined;
    /**
     * 0: m values prohibited; 1: m values mandatory; 2: m values optional
     * @member {byte}
     */
    this.m = undefined;
  }
  getGeometryType() {
    return this.geometry_type_name;
  }
}
GeometryColumns.TABLE_NAME = "tableName";
GeometryColumns.COLUMN_NAME = "columnName";
GeometryColumns.GEOMETRY_TYPE_NAME = "geometryTypeName";
GeometryColumns.SRS_ID = "srsId";
GeometryColumns.Z = "z";
GeometryColumns.M = "m";

module.exports = GeometryColumns;
