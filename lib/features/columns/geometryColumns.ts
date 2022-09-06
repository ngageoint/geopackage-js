import { GeoPackageException } from '../../geoPackageException';
import { TableColumnKey } from '../../db/tableColumnKey';
import { GeometryType } from '@ngageoint/simple-features-js';
import { SpatialReferenceSystemConstants } from '../../srs/spatialReferenceSystemConstants';
import { Contents } from '../../contents/contents';

/**
 * Geometry Columns object. Identifies the geometry columns in tables that contain user data representing features.
 * @class GeometryColumns
 */
export class GeometryColumns {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'gpkg_geometry_columns';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME = Contents.COLUMN_TABLE_NAME;

  /**
   * columnName field name
   */
  public static readonly COLUMN_COLUMN_NAME = 'column_name';

  /**
   * id 1 field name, tableName
   */
  public static readonly COLUMN_ID_1 = GeometryColumns.COLUMN_TABLE_NAME;

  /**
   * id 2 field name, columnName
   */
  public static readonly COLUMN_ID_2 = GeometryColumns.COLUMN_COLUMN_NAME;

  /**
   * geometryTypeName field name
   */
  public static readonly COLUMN_GEOMETRY_TYPE_NAME = 'geometry_type_name';

  /**
   * srsId field name
   */
  public static readonly COLUMN_SRS_ID = SpatialReferenceSystemConstants.COLUMN_SRS_ID;

  /**
   * z field name
   */
  public static readonly COLUMN_Z = 'z';

  /**
   * m field name
   */
  public static readonly COLUMN_M = 'm';

  /**
   * Name of the table containing the geometry column
   */
  private table_name: string;

  /**
   * Name of a column in the feature table that is a Geometry Column
   */
  private column_name: string;

  /**
   * Name from Geometry Type Codes (Core) or Geometry Type Codes (Extension)
   * in Geometry Types (Normative)
   */
  private geometry_type_name: string;

  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   */
  private srs_id: number;

  /**
   * 0: z values prohibited; 1: z values mandatory; 2: z values optional
   */
  private z: number;

  /**
   * 0: m values prohibited; 1: m values mandatory; 2: m values optional
   */
  private m: number;

  /**
   * Default Constructor
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof GeometryColumns) {
      const geometryColumns = args[0];
      this.table_name = geometryColumns.table_name;
      this.column_name = geometryColumns.column_name;
      this.geometry_type_name = geometryColumns.geometry_type_name;
      this.srs_id = geometryColumns.srs_id;
      this.z = geometryColumns.z;
      this.m = geometryColumns.m;
    }
  }

  /**
   * Get the id
   *
   * @return table column key
   */
  public getId(): TableColumnKey {
    return new TableColumnKey(this.table_name, this.column_name);
  }

  /**
   * Set the id
   *
   * @param id
   *            id
   */
  public setId(id: TableColumnKey): void {
    this.table_name = id.getTableName();
    this.column_name = id.getColumnName();
  }

  /**
   * Get the table name
   * @return table name
   */
  public getTableName(): string {
    return this.table_name;
  }

  /**
   * Set the table name
   * @param tableName table name
   */
  public setTableName(tableName: string): void {
    this.table_name = tableName;
  }

  /**
   * Get the column name
   * @return column name
   */
  public getColumnName(): string {
    return this.column_name;
  }

  /**
   * Set the column name
   *
   * @param columnName
   *            column name
   */
  public setColumnName(columnName: string): void {
    this.column_name = columnName;
  }

  /**
   * Get the geometry type
   *
   * @return geometry type
   */
  public getGeometryType(): GeometryType {
    return GeometryType.fromName(this.geometry_type_name);
  }

  /**
   * Set the geometry type
   *
   * @param geometryType
   *            geometry type
   */
  public setGeometryType(geometryType: GeometryType): void {
    this.geometry_type_name = GeometryType.nameFromType(geometryType);
  }

  /**
   * Get the geometry type name
   *
   * @return geometry type name
   */
  public getGeometryTypeName(): string {
    return this.geometry_type_name;
  }

  /**
   * Get the srs id
   *
   * @return srs id
   */
  public getSrsId(): number {
    return this.srs_id;
  }

  /**
   * Set the srs id
   *
   * @param srsId srs id
   */
  public setSrsId(srsId: number): void {
    this.srs_id = srsId;
  }

  /**
   * Get the z
   *
   * @return z
   */
  public getZ(): number {
    return this.z;
  }

  /**
   * Set the z
   *
   * @param z
   *            z
   */
  public setZ(z: number): void {
    this.validateValues(GeometryColumns.COLUMN_Z, z);
    this.z = z;
  }

  /**
   * Get the m
   *
   * @return m
   */
  public getM(): number {
    return this.m;
  }

  /**
   * Set the m
   *
   * @param m
   *            m
   */
  public setM(m: number): void {
    this.validateValues(GeometryColumns.COLUMN_M, m);
    this.m = m;
  }

  /**
   * Validate the z and m byte values. They must be 0 for prohibited, 1 for
   * mandatory, or 2 for optional. (Spec Requirement 27 & 28)
   *
   * @param column
   * @param value
   */
  private validateValues(column: string, value: number): void {
    if (value < 0 || value > 2) {
      throw new GeoPackageException(column + ' value must be 0 for prohibited, 1 for mandatory, or 2 for optional');
    }
  }
}
