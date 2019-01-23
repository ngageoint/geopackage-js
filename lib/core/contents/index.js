/**
 * Contents module.
 * @module core/contents
 */

var Dao = require('../../dao/dao')
  , GeometryColumnsDao = require('../../features/columns').GeometryColumnsDao
  , SpatialReferenceSystemDao = require('../srs').SpatialReferenceSystemDao
  , TileMatrixDao = require('../../tiles/matrix').TileMatrixDao
  , TileMatrixSetDao = require('../../tiles/matrixset').TileMatrixSetDao
  , ColumnValues = require('../../dao/columnValues');

var util = require('util');

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class Contents
 */
var Contents = function() {
  /**
   * the name of the tiles, or feature table
   * @member {string}
   */
  this.table_name;

  /**
   * Type of data stored in the table:. “features” per clause Features,
   * “tiles” per clause Tiles, or an implementer-defined value for other data
   * tables per clause in an Extended GeoPackage.
   * @member {string}
   */
  this.data_type;

  /**
   * A human-readable identifier (e.g. short name) for the table_name content
   * @member {string}
   */
  this.identifier;

  /**
   * A human-readable description for the table_name content
   * @member {string}
   */
  this.description;

  /**
   * timestamp value in ISO 8601 format as defined by the strftime function
   * %Y-%m-%dT%H:%M:%fZ format string applied to the current time
   * @member {Date}
   */
  this.last_change;

  /**
   * Bounding box minimum easting or longitude for all content in table_name
   * @member {Number}
   */
  this.min_x;

  /**
   * Bounding box minimum northing or latitude for all content in table_name
   * @member {Number}
   */
  this.min_y;

  /**
   * Bounding box maximum easting or longitude for all content in table_name
   * @member {Number}
   */
  this.max_x;

  /**
   * Bounding box maximum northing or latitude for all content in table_name
   * @member {Number}
   */
  this.max_y;

  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   * @member {Number}
   */
  this.srs_id;
}

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class ContentsDao
 * @extends {module:dao/dao~Dao}
 */
var ContentsDao = function(geoPackage) {
  Dao.call(this, geoPackage);
}

util.inherits(ContentsDao, Dao);

/**
 * Creates a new Contents object
 * @return {module:core/contents~Contents} new Contents object
 */
ContentsDao.prototype.createObject = function () {
  return new Contents();
};

/**
 * Get table names by table type
 * @param  {string} [tableType] table type to query for
 * @return {string[]}           Array of table names
 */
ContentsDao.prototype.getTables = function(tableType) {
  var results;
  if (tableType) {
    var fieldValues = new ColumnValues();
    fieldValues.addColumn(ContentsDao.COLUMN_DATA_TYPE, tableType);
    results = this.queryForColumns('table_name', fieldValues);
  } else {
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
 * @return {proj4}          proj4 projection
 */
ContentsDao.prototype.getProjection = function (contents) {
  var srs = this.getSrs(contents);
  var srsDao = this.geoPackage.getSpatialReferenceSystemDao();
  return srsDao.getProjection(srs);
};

/**
 * Get the SpatialReferenceSystemDao for the Contents
 * @param  {module:core/contents~Contents} contents Contents to get the SpatialReferenceSystemDao from
 * @return {module:core/srs~SpatialReferenceSystemDao}
 */
ContentsDao.prototype.getSrs = function (contents) {
  var dao = this.geoPackage.getSpatialReferenceSystemDao();
  return dao.queryForId(contents.srs_id);
};

/**
 * Get the GeometryColumns for the Contents
 * @param  {module:core/contents~Contents} contents Contents
 * @return {module:features/columns~GeometryColumns}
 */
ContentsDao.prototype.getGeometryColumns = function (contents) {
  var dao = this.geoPackage.getGeometryColumnsDao();
  // TODO what is causing this to need to be here and not up in the require section
  var GeometryColumnsDao = require('../../features/columns').GeometryColumnsDao;
  var results = dao.queryForAllEq(GeometryColumnsDao.COLUMN_TABLE_NAME, contents.table_name);
  if (!results || !results.length) return;
  var gc = dao.createObject();
  dao.populateObjectFromResult(gc, results[0]);
  return gc;
};

/**
 * Get the TileMatrixSet for the Contents
 * @param  {module:core/contents~Contents} contents Contents
 * @return {module:tiles/matrixset~TileMatrixSet}
 */
ContentsDao.prototype.getTileMatrixSet = function (contents) {
  var dao = this.geoPackage.getTileMatrixSetDao();
  var results = dao.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, contents.table_name);
  if (!results || !results.length) return;
  var gc = dao.createObject();
  dao.populateObjectFromResult(gc, results[0]);
  return gc;
};

/**
 * Get the TileMatrix for the Contents
 * @param  {module:core/contents~Contents} contents Contents
 * @return {module:tiles/matrix~TileMatrix}
 */
ContentsDao.prototype.getTileMatrix = function (contents) {
  var dao = this.geoPackage.getTileMatrixDao();
  var results = dao.queryForAllEq(TileMatrixDao.COLUMN_TABLE_NAME, contents.table_name);
  if (!results || !results.length) return;
  var tileMatricies = [];
  for (var i = 0; i < results.length; i++) {
    var gc = dao.createObject();
    dao.populateObjectFromResult(gc, results[i]);
    tileMatricies.push(gc);
  }
  return tileMatricies;
};

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
ContentsDao.GPKG_CDT_VECTORTILES_NAME = "vector-tiles";

ContentsDao.prototype.gpkgTableName = ContentsDao.TABLE_NAME;
ContentsDao.prototype.idColumns = [ContentsDao.COLUMN_PK];

module.exports.ContentsDao = ContentsDao;
Contents.TABLE_NAME = ContentsDao.TABLE_NAME;
module.exports.Contents = Contents;
