import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';

/**
 * Spatial Reference System object. The coordinate reference system definitions it contains are referenced by the GeoPackage Contents and GeometryColumns objects to relate the vector and tile data in user tables to locations on the earth.
 * @class GeometryColumns
 */
export class GeometryColumns {
  public static readonly TABLE_NAME: string = 'tableName';
  public static readonly COLUMN_NAME: string = 'columnName';
  public static readonly GEOMETRY_TYPE_NAME: string = 'geometryTypeName';
  public static readonly SRS_ID: string = 'srsId';
  public static readonly Z: string = 'z';
  public static readonly M: string = 'm';
  /**
   * Name of the table containing the geometry column
   * @member {string}
   */
  table_name: string;
  /**
   * Name of a column in the feature table that is a Geometry Column
   * @member {string}
   */
  column_name: string;
  /**
   * Name from Geometry Type Codes (Core) or Geometry Type Codes (Extension)
   * in Geometry Types (Normative)
   * @member {string}
   */
  geometry_type_name: string;
  /**
   * Spatial Reference System ID: gpkg_spatial_ref_sys.srs_id
   * @member {module:dao/spatialReferenceSystem~SpatialReferenceSystem}
   */
  srs: SpatialReferenceSystem;
  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   * @member {Number}
   */
  srs_id: number;
  /**
   * 0: z values prohibited; 1: z values mandatory; 2: z values optional
   * @member {byte}
   */
  z: number;
  /**
   * 0: m values prohibited; 1: m values mandatory; 2: m values optional
   * @member {byte}
   */
  m: number;
  get geometryType(): string {
    return this.geometry_type_name;
  }
  get id(): string {
    return `${this.table_name} ${this.column_name}`;
  }
}
