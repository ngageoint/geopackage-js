/* eslint-disable camelcase */
/**
 * GeometryColumns module.
 * @module features/columns
 */
import {Dao} from '../../dao/dao';

import {GeometryColumns} from './geometryColumns';
import {SpatialReferenceSystem} from '../../core/srs/spatialReferenceSystem';
import {Contents} from '../../core/contents/contents';
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
  public static readonly COLUMN_TABLE_NAME: string = "table_name";

  /**
   * columnName field name
   * @type {String}
   */
  public static readonly COLUMN_COLUMN_NAME: string = "column_name";

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
  public static readonly COLUMN_GEOMETRY_TYPE_NAME: string = "geometry_type_name";

  /**
   * srsId field name
   * @type {String}
   */
  public static readonly COLUMN_SRS_ID: string = 'srs_id';

  /**
   * z field name
   * @type {String}
   */
  public static readonly COLUMN_Z: string = "z";

  /**
   * m field name
   * @type {String}
   */
  public static readonly COLUMN_M: string = "m";

  /**
   * Table Name
   * @type {String}
   */
  readonly gpkgTableName: string = 'gpkg_geometry_columns';

  readonly idColumns: string[] = [GeometryColumnsDao.COLUMN_ID_1, GeometryColumnsDao.COLUMN_ID_2];
  readonly columns: string[] =
    [GeometryColumnsDao.COLUMN_TABLE_NAME, GeometryColumnsDao.COLUMN_COLUMN_NAME, GeometryColumnsDao.COLUMN_GEOMETRY_TYPE_NAME, GeometryColumnsDao.COLUMN_SRS_ID, GeometryColumnsDao.COLUMN_Z, GeometryColumnsDao.COLUMN_M];

  createObject(): GeometryColumns {
    return new GeometryColumns();
  }
  /**
   *  Query for the table name
   *
   *  @param {string} tableName table name
   */
  queryForTableName(tableName: string): GeometryColumns {
    var results = this.queryForAllEq(GeometryColumnsDao.COLUMN_TABLE_NAME, tableName);
    if (results && results.length) {
      var gc = this.createObject();
      this.populateObjectFromResult(gc, results[0]);
      return gc;
    }
    return;
  }
  /**
   *  Get the feature table names
   * @returns {String []} feature table names
   */
  getFeatureTables(): string[] {
    var tableNames = [];
    for (var result of this.connection.each('select ' + GeometryColumnsDao.COLUMN_TABLE_NAME + ' from ' + this.gpkgTableName)) {
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
    var dao = this.geoPackage.getSpatialReferenceSystemDao();
    return dao.queryForId(geometryColumns.srs_id);
  }
  /**
   *  Get the Contents of the Geometry Columns
   *
   *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
   *  @return {ContentsDao} contents dao
   */
  getContents(geometryColumns: GeometryColumns): Contents {
    var dao = this.geoPackage.getContentsDao();
    return dao.queryForId(geometryColumns.table_name);
  }
  getProjection(projectionObject: GeometryColumns): any {
    var srs = this.getSrs(projectionObject);
    var srsDao = this.geoPackage.getSpatialReferenceSystemDao();
    return srsDao.getProjection(srs);
  }
}