import { GeometryIndexKey } from './geometryIndexKey';
import { TableIndex } from './tableIndex';

/**
 * Geometry Index object, for indexing geometries within user feature tables
 */
export class GeometryIndex {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'nga_geometry_index';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME = 'table_name';

  /**
   * Geometry Id column
   */
  public static readonly COLUMN_GEOM_ID = 'geom_id';

  /**
   * Min X
   */
  public static readonly COLUMN_MIN_X = 'min_x';

  /**
   * Max X
   */
  public static readonly COLUMN_MAX_X = 'max_x';

  /**
   * Min Y
   */
  public static readonly COLUMN_MIN_Y = 'min_y';

  /**
   * Max Y
   */
  public static readonly COLUMN_MAX_Y = 'max_y';

  /**
   * Min Z
   */
  public static readonly COLUMN_MIN_Z = 'min_z';

  /**
   * Max Z
   */
  public static readonly COLUMN_MAX_Z = 'max_z';

  /**
   * Min M
   */
  public static readonly COLUMN_MIN_M = 'min_m';

  /**
   * Max M
   */
  public static readonly COLUMN_MAX_M = 'max_m';

  /**
   * Foreign key to Extensions by table name
   */
  private tableIndex: TableIndex;

  /**
   * Name of the feature table
   */
  private table_name: string;

  /**
   * Geometry id
   */
  private geom_id: number;

  /**
   * Min X
   */
  private min_x: number;

  /**
   * Max X
   */
  private max_x: number;

  /**
   * Min Y
   */
  private min_y: number;

  /**
   * Max Y
   */
  private max_y: number;

  /**
   * Min Z
   */
  private min_z: number;

  /**
   * Max Z
   */
  private max_z: number;

  /**
   * Min M
   */
  private min_m: number;

  /**
   * Max M
   */
  private max_m: number;

  public constructor();
  public constructor(geometryIndex: GeometryIndex);

  /**
   * Default Constructor
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof GeometryIndex) {
      const geometryIndex = args[0];
      this.tableIndex = geometryIndex.tableIndex;
      this.table_name = geometryIndex.table_name;
      this.geom_id = geometryIndex.geom_id;
      this.min_x = geometryIndex.min_x;
      this.max_x = geometryIndex.max_x;
      this.min_y = geometryIndex.min_y;
      this.max_y = geometryIndex.max_y;
      this.min_z = geometryIndex.min_z;
      this.max_z = geometryIndex.max_z;
      this.min_m = geometryIndex.min_m;
      this.max_m = geometryIndex.max_m;
    }
  }

  /**
   * Get the id
   *
   * @return geometry index key
   */
  public getId(): GeometryIndexKey {
    return new GeometryIndexKey(this.table_name, this.geom_id);
  }

  /**
   * Set the id
   * @param id geometry index key
   */
  public setId(id: GeometryIndexKey): void {
    this.table_name = id.getTableName();
    this.geom_id = id.getGeomId();
  }

  /**
   * Get the table index
   *
   * @return table index
   */
  public getTableIndex(): TableIndex {
    return this.tableIndex;
  }

  /**
   * Set the table index
   *
   * @param tableIndex
   *            table index
   */
  public setTableIndex(tableIndex: TableIndex): void {
    this.tableIndex = tableIndex;
    if (tableIndex != null) {
      this.table_name = tableIndex.getTableName();
    } else {
      this.table_name = null;
    }
  }

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.table_name;
  }

  /**
   * Get the geometry id
   *
   * @return geometry id
   */
  public getGeomId(): number {
    return this.geom_id;
  }

  /**
   * Set the geometry id
   *
   * @param geomId
   *            geom id
   */
  public setGeomId(geomId: number): void {
    this.geom_id = geomId;
  }

  /**
   * Get the min x
   *
   * @return min x
   */
  public getMinX(): number {
    return this.min_x;
  }

  /**
   * Set the min x
   *
   * @param minX
   *            min x
   */
  public setMinX(minX: number): void {
    this.min_x = minX;
  }

  /**
   * Get the max x
   *
   * @return max x
   */
  public getMaxX(): number {
    return this.max_x;
  }

  /**
   * Set the max x
   *
   * @param maxX
   *            max x
   */
  public setMaxX(maxX: number): void {
    this.max_x = maxX;
  }

  /**
   * Get the min y
   *
   * @return min y
   */
  public getMinY(): number {
    return this.min_y;
  }

  /**
   * Set the min y
   *
   * @param minY
   *            min y
   */
  public setMinY(minY: number): void {
    this.min_y = minY;
  }

  /**
   * Get the max y
   *
   * @return max y
   */
  public getMaxY(): number {
    return this.max_y;
  }

  /**
   * Set the max y
   *
   * @param maxY
   *            max y
   */
  public setMaxY(maxY: number): void {
    this.max_y = maxY;
  }

  /**
   * Get the min z
   *
   * @return min z
   */
  public getMinZ(): number {
    return this.min_z;
  }

  /**
   * Set the min z
   *
   * @param minZ
   *            min z
   */
  public setMinZ(minZ: number): void {
    this.min_z = minZ;
  }

  /**
   * Get the max z
   *
   * @return max z
   */
  public getMaxZ(): number {
    return this.max_z;
  }

  /**
   * Set the max z
   *
   * @param maxZ
   *            max z
   */
  public setMaxZ(maxZ: number): void {
    this.max_z = maxZ;
  }

  /**
   * Get the min m
   *
   * @return min m
   */
  public getMinM(): number {
    return this.min_m;
  }

  /**
   * Set the min m
   *
   * @param minM
   *            min m
   */
  public setMinM(minM: number): void {
    this.min_m = minM;
  }

  /**
   * Get the max m
   *
   * @return max m
   */
  public getMaxM(): number {
    return this.max_m;
  }

  /**
   * Set the max m
   *
   * @param maxM
   *            max m
   */
  public setMaxM(maxM: number): void {
    this.max_m = maxM;
  }
}
