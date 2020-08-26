/* eslint-disable camelcase */
/**
 * GeometryColumns module.
 * @module features/columns
 */
import { Dao } from '../../dao/dao';
import { GeometryColumns } from './geometryColumns';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';
import { Contents } from '../../core/contents/contents';
import { DBValue } from '../../db/dbAdapter';
/**
 * Geometry Columns Data Access Object
 * @class GeometryColumnsDao
 * @extends Dao
 */
export class GeometryColumnsDao extends Dao<GeometryColumns> {
  /**
   * tableName field name
   * @type {String}
   */
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';

  /**
   * columnName field name
   * @type {String}
   */
  public static readonly COLUMN_COLUMN_NAME: string = 'column_name';

  /**
   * id 1 field name, tableName
   * @type {String}
   */
  public static readonly COLUMN_ID_1: string = GeometryColumnsDao.COLUMN_TABLE_NAME;

  /**
   * id 2 field name, columnName
   * @type {String}
   */
  public static readonly COLUMN_ID_2: string = GeometryColumnsDao.COLUMN_COLUMN_NAME;

  /**
   * geometryTypeName field name
   * @type {String}
   */
  public static readonly COLUMN_GEOMETRY_TYPE_NAME: string = 'geometry_type_name';

  /**
   * srsId field name
   * @type {String}
   */
  public static readonly COLUMN_SRS_ID: string = 'srs_id';

  /**
   * z field name
   * @type {String}
   */
  public static readonly COLUMN_Z: string = 'z';

  /**
   * m field name
   * @type {String}
   */
  public static readonly COLUMN_M: string = 'm';

  /**
   * Table Name
   * @type {String}
   */
  readonly gpkgTableName: string = 'gpkg_geometry_columns';

  readonly idColumns: string[] = [GeometryColumnsDao.COLUMN_ID_1, GeometryColumnsDao.COLUMN_ID_2];
  readonly columns: string[] = [
    GeometryColumnsDao.COLUMN_TABLE_NAME,
    GeometryColumnsDao.COLUMN_COLUMN_NAME,
    GeometryColumnsDao.COLUMN_GEOMETRY_TYPE_NAME,
    GeometryColumnsDao.COLUMN_SRS_ID,
    GeometryColumnsDao.COLUMN_Z,
    GeometryColumnsDao.COLUMN_M,
  ];

  createObject(results?: Record<string, DBValue>): GeometryColumns {
    const gc = new GeometryColumns();
    if (results) {
      gc.table_name = results.table_name as string;
      gc.column_name = results.column_name as string;
      gc.geometry_type_name = results.geometry_type_name as string;
      gc.srs_id = results.srs_id as number;
      gc.z = results.z as number;
      gc.m = results.m as number;
    }
    return gc;
  }
  /**
   *  Query for the table name
   *
   *  @param {string} tableName table name
   */
  queryForTableName(tableName: string): GeometryColumns {
    const results = this.queryForAllEq(GeometryColumnsDao.COLUMN_TABLE_NAME, tableName);
    if (results && results.length) {
      return this.createObject(results[0]);
    }
    return;
  }
  /**
   *  Get the feature table names
   * @returns {String []} feature table names
   */
  getFeatureTables(): string[] {
    const tableNames = [];
    for (const result of this.connection.each(
      'select ' + GeometryColumnsDao.COLUMN_TABLE_NAME + ' from ' + this.gpkgTableName,
    )) {
      tableNames.push(result[GeometryColumnsDao.COLUMN_TABLE_NAME]);
    }
    return tableNames;
  }
  /**
   *  Get the Spatial Reference System of the Geometry Columns
   *
   *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
   */
  getSrs(geometryColumns: GeometryColumns): SpatialReferenceSystem {
    return this.geoPackage.spatialReferenceSystemDao.queryForId(geometryColumns.srs_id);
  }
  /**
   *  Get the Contents of the Geometry Columns
   *
   *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
   *  @return {ContentsDao} contents dao
   */
  getContents(geometryColumns: GeometryColumns): Contents {
    return this.geoPackage.contentsDao.queryForId(geometryColumns.table_name);
  }
  getProjection(projectionObject: GeometryColumns): proj4.Converter {
    const srs = this.getSrs(projectionObject);
    return this.geoPackage.spatialReferenceSystemDao.getProjection(srs);
  }
}
