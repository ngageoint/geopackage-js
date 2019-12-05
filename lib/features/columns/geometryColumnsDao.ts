/* eslint-disable camelcase */
/**
 * GeometryColumns module.
 * @module features/columns
 */
import Dao from '../../dao/dao';

var GeometryColumns = require('./geometryColumns')
  // eslint-disable-next-line no-unused-vars
  , ContentsDao = require('../../core/contents/contentsDao');

// /**
//  * Contents
//  */
// @ForeignCollectionField(eager = false)
// private ForeignCollection<Contents> contents;
//
// /**
//  * Geometry Columns
//  */
// @ForeignCollectionField(eager = false)
// private ForeignCollection<GeometryColumns> geometryColumns;
//
// /**
//  * Matrix Tile Set
//  */
// @ForeignCollectionField(eager = false)
// private ForeignCollection<TileMatrixSet> tileMatrixSet;
/**
 * Geometry Columns Data Access Object
 * @class GeometryColumnsDao
 * @extends Dao
 */
export default class GeometryColumnsDao extends Dao<typeof GeometryColumns> {
  /**
   * tableName field name
   * @type {String}
   */
  public static readonly COLUMN_TABLE_NAME = "table_name";

  /**
   * columnName field name
   * @type {String}
   */
  public static readonly COLUMN_COLUMN_NAME = "column_name";

  /**
   * id 1 field name, tableName
   * @type {String}
   */
  public static readonly COLUMN_ID_1 = GeometryColumnsDao.COLUMN_TABLE_NAME;

  /**
   * id 2 field name, columnName
   * @type {String}
   */
  public static readonly COLUMN_ID_2 = GeometryColumnsDao.COLUMN_COLUMN_NAME;

  /**
   * geometryTypeName field name
   * @type {String}
   */
  public static readonly COLUMN_GEOMETRY_TYPE_NAME = "geometry_type_name";

  /**
   * srsId field name
   * @type {String}
   */
  public static readonly COLUMN_SRS_ID = 'srs_id';

  /**
   * z field name
   * @type {String}
   */
  public static readonly COLUMN_Z = "z";

  /**
   * m field name
   * @type {String}
   */
  public static readonly COLUMN_M = "m";

  /**
   * Table Name
   * @type {String}
   */
  readonly gpkgTableName = 'gpkg_geometry_columns';

  readonly idColumns = [GeometryColumnsDao.COLUMN_ID_1, GeometryColumnsDao.COLUMN_ID_2];
  readonly columns =
    [GeometryColumnsDao.COLUMN_TABLE_NAME, GeometryColumnsDao.COLUMN_COLUMN_NAME, GeometryColumnsDao.COLUMN_GEOMETRY_TYPE_NAME, GeometryColumnsDao.COLUMN_SRS_ID, GeometryColumnsDao.COLUMN_Z, GeometryColumnsDao.COLUMN_M];

  createObject() {
    return new GeometryColumns();
  }
  /**
   *  Query for the table name
   *
   *  @param {string} tableName table name
   */
  queryForTableName(tableName) {
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
  getFeatureTables() {
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
  getSrs(geometryColumns) {
    var dao = this.geoPackage.getSpatialReferenceSystemDao();
    return dao.queryForId(geometryColumns.srs_id);
  }
  /**
   *  Get the Contents of the Geometry Columns
   *
   *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
   *  @return {ContentsDao} contents dao
   */
  getContents(geometryColumns) {
    var dao = this.geoPackage.getContentsDao();
    return dao.queryForId(geometryColumns.table_name);
  }
  getProjection(projectionObject) {
    var srs = this.getSrs(projectionObject);
    var srsDao = this.geoPackage.getSpatialReferenceSystemDao();
    return srsDao.getProjection(srs);
  }
}