var Dao = require('../../dao/dao')
  , TileMatrixDao = require('../../tiles/matrix/tileMatrixDao')
  , TileMatrixSetDao = require('../../tiles/matrixset/tileMatrixSetDao')
  , ColumnValues = require('../../dao/columnValues')
  , Contents = require('./contents');

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class ContentsDao
 * @extends Dao
 */
class ContentsDao extends Dao {
  /**
   * Creates a new Contents object
   * @return {module:core/contents~Contents} new Contents object
   */
  createObject() {
    return new Contents();
  }
  /**
   * Get table names by table type
   * @param  {string} [tableType] table type to query for
   * @return {string[]}           Array of table names
   */
  getTables(tableType) {
    var results;
    if (tableType) {
      var fieldValues = new ColumnValues();
      fieldValues.addColumn(ContentsDao.COLUMN_DATA_TYPE, tableType);
      results = this.queryForColumns('table_name', fieldValues);
    }
    else {
      results = this.queryForColumns('table_name');
    }
    var tableNames = [];
    for (var i = 0; i < results.length; i++) {
      tableNames.push(results[i].table_name);
    }
    return tableNames;
  }
  /**
   * Returns the proj4 projection for the Contents
   * @param  {module:core/contents~Contents} contents Contents to get the projection from
   * @return {*}          proj4 projection
   */
  getProjection(contents) {
    var srs = this.getSrs(contents);
    var srsDao = this.geoPackage.getSpatialReferenceSystemDao();
    return srsDao.getProjection(srs);
  }
  /**
   * Get the SpatialReferenceSystemDao for the Contents
   * @param  {module:core/contents~Contents} contents Contents to get the SpatialReferenceSystemDao from
   * @return {module:core/srs~SpatialReferenceSystemDao}
   */
  getSrs(contents) {
    var dao = this.geoPackage.getSpatialReferenceSystemDao();
    return dao.queryForId(contents.srs_id);
  }
  /**
   * Get the GeometryColumns for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:features/columns~GeometryColumns}
   */
  getGeometryColumns(contents) {
    var dao = this.geoPackage.getGeometryColumnsDao();
    // TODO what is causing this to need to be here and not up in the require section
    var GeometryColumnsDao = require('../../features/columns/geometryColumnsDao');
    var results = dao.queryForAllEq(GeometryColumnsDao.COLUMN_TABLE_NAME, contents.table_name);
    if (!results || !results.length)
      return;
    var gc = dao.createObject();
    dao.populateObjectFromResult(gc, results[0]);
    return gc;
  }
  /**
   * Get the TileMatrixSet for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:tiles/matrixset~TileMatrixSet}
   */
  getTileMatrixSet(contents) {
    var dao = this.geoPackage.getTileMatrixSetDao();
    var results = dao.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, contents.table_name);
    if (!results || !results.length)
      return;
    var gc = dao.createObject();
    dao.populateObjectFromResult(gc, results[0]);
    return gc;
  }
  /**
   * Get the TileMatrix for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:tiles/matrix~TileMatrix}
   */
  getTileMatrix(contents) {
    var dao = this.geoPackage.getTileMatrixDao();
    var results = dao.queryForAllEq(TileMatrixDao.COLUMN_TABLE_NAME, contents.table_name);
    if (!results || !results.length)
      return;
    var tileMatricies = [];
    for (var i = 0; i < results.length; i++) {
      var gc = dao.createObject();
      dao.populateObjectFromResult(gc, results[i]);
      tileMatricies.push(gc);
    }
    return tileMatricies;
  }
}

ContentsDao.TABLE_NAME = "gpkg_contents";
ContentsDao.COLUMN_PK = "table_name";
ContentsDao.COLUMN_TABLE_NAME = "table_name";
ContentsDao.COLUMN_DATA_TYPE = "data_type";
ContentsDao.COLUMN_IDENTIFIER = "identifier";
ContentsDao.COLUMN_DESCRIPTION = "description";
ContentsDao.COLUMN_LAST_CHANGE = "last_change";
ContentsDao.COLUMN_MIN_X = "min_x";
ContentsDao.COLUMN_MIN_Y = "min_y";
ContentsDao.COLUMN_MAX_X = "max_x";
ContentsDao.COLUMN_MAX_Y = "max_y";
ContentsDao.COLUMN_SRS_ID = "srs_id";

ContentsDao.GPKG_CDT_FEATURES_NAME = "features";
ContentsDao.GPKG_CDT_TILES_NAME = "tiles";
ContentsDao.GPKG_CDT_ATTRIBUTES_NAME = "attributes";

ContentsDao.prototype.gpkgTableName = ContentsDao.TABLE_NAME;
ContentsDao.prototype.idColumns = [ContentsDao.COLUMN_PK];

module.exports = ContentsDao;