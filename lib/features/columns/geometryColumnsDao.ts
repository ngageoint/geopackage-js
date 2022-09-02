/* eslint-disable camelcase */
/**
 * GeometryColumns module.
 * @module features/columns
 */
import { GeometryColumns } from './geometryColumns';
import { SpatialReferenceSystem } from '../../srs/spatialReferenceSystem';
import { Contents } from '../../contents/contents';
import { DBValue } from '../../db/dbValue';
import { Projection } from '@ngageoint/projections-js';
import { GeoPackageDao } from '../../db/geoPackageDao';
import { GeometryType } from '@ngageoint/simple-features-js';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { SpatialReferenceSystemDao } from '../../srs/spatialReferenceSystemDao';
import { TableColumnKey } from '../../db/tableColumnKey';
import { ContentsDao } from '../../contents/contentsDao';

/**
 * Geometry Columns Data Access Object
 */
export class GeometryColumnsDao extends GeoPackageDao<GeometryColumns, TableColumnKey> {
  /**
   * Table Name
   * @type {String}
   */
  readonly gpkgTableName: string = 'gpkg_geometry_columns';

  /**
   *
   * @param geoPackage GeoPackage object this dao belongs to
   */
  constructor(readonly geoPackageConnection: GeoPackageConnection) {
    super(geoPackageConnection, GeometryColumns.TABLE_NAME);
  }

  /**
   * Create the DAO
   * @param geoPackage GeoPackage
   * @return dao
   */
  public static createDao(geoPackageConnection: GeoPackageConnection): GeometryColumnsDao {
    return new GeometryColumnsDao(geoPackageConnection);
  }

  readonly idColumns: string[] = [GeometryColumns.COLUMN_ID_1, GeometryColumns.COLUMN_ID_2];
  readonly columns: string[] = [
    GeometryColumns.COLUMN_TABLE_NAME,
    GeometryColumns.COLUMN_COLUMN_NAME,
    GeometryColumns.COLUMN_GEOMETRY_TYPE_NAME,
    GeometryColumns.COLUMN_SRS_ID,
    GeometryColumns.COLUMN_Z,
    GeometryColumns.COLUMN_M,
  ];

  /**
   * Creates a GeometryColumns object from a Record
   * @param results
   * @override
   */
  createObject(results?: Record<string, DBValue>): GeometryColumns {
    const gc = new GeometryColumns();
    if (results) {
      gc.setTableName(results.table_name as string);
      gc.setColumnName(results.column_name as string);
      gc.setGeometryType(GeometryType.fromName(results.geometry_type_name as string));
      gc.setZ(results.z as number);
      gc.setM(results.m as number);
      gc.setSrs(SpatialReferenceSystemDao.createDao(this.db).getBySrsId(results.srs_id as number));
      gc.setSrsId(results.srs_id as number);
    }
    return gc;
  }

  /**
   *  Query for the table name
   *
   *  @param {string} tableName table name
   */
  queryForTableName(tableName: string): GeometryColumns {
    const results = this.queryForAllEq(GeometryColumns.COLUMN_TABLE_NAME, tableName);
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
    for (const result of this.db.each('select ' + GeometryColumns.COLUMN_TABLE_NAME + ' from ' + this.gpkgTableName)) {
      tableNames.push(result[GeometryColumns.COLUMN_TABLE_NAME]);
    }
    return tableNames;
  }
  /**
   *  Get the Spatial Reference System of the Geometry Columns
   *
   *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
   */
  getSrs(geometryColumns: GeometryColumns): SpatialReferenceSystem {
    return SpatialReferenceSystemDao.createDao(this.db).queryForId(geometryColumns.getSrsId());
  }
  /**
   *  Get the Contents of the Geometry Columns
   *
   *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
   *  @return {ContentsDao} contents dao
   */
  getContents(geometryColumns: GeometryColumns): Contents {
    return ContentsDao.createDao(this.db).queryForId(geometryColumns.getTableName());
  }
  getProjection(projectionObject: GeometryColumns): Projection {
    const srs = this.getSrs(projectionObject);
    return SpatialReferenceSystemDao.createDao(this.db).getProjection(srs);
  }

  queryForIdWithKey(key: TableColumnKey): GeometryColumns {
    return this.queryForMultiId([key.getTableName(), key.getColumnName()]);
  }
}
