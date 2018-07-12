/**
 * Contents module.
 * @module core/contents
 * @see module:dao/dao
 */

var Dao = require('../../dao/dao')

  , SpatialReferenceSystemDao = require('../srs').SpatialReferenceSystemDao
  , TileMatrixDao = require('../../tiles/matrix').TileMatrixDao
  , TileMatrixSetDao = require('../../tiles/matrixset').TileMatrixSetDao;

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
 * @class
 * @extends {module:dao/dao~Dao}
 */
var ContentsDao = function(db) {
  Dao.call(this, db);
}

util.inherits(ContentsDao, Dao);

ContentsDao.prototype.createObject = function () {
  return new Contents();
};

ContentsDao.prototype.getProjection = function (contents, callback) {
  var srs = this.getSrs(contents);
  var srsDao = this.getSpatialReferenceSystemDao();
  callback(null, srsDao.getProjection(srs));
};

ContentsDao.prototype.validateObject = function(object) {
  throw new Error('not implemented');
}

ContentsDao.prototype.deleteCascade = function () {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteCascadeWithUserTable = function (contents, userTable) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteCascadeWithCollection = function (contentsCollection) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteCascadeWithCollectionAndUserTable = function (contentsCollection, userTable) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteCascadeWhere = function (where, whereArgs) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteCascadeWhereWithUserTable = function (where, whereArgs, userTable) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteByIdCascade = function (id) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteByIdCascadeWithUserTable = function (id, userTable) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteByIdsCascade = function (idCollection) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteByIdsCascadeWithUserTable = function (idCollection, userTable) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteTable = function (tableName) {
  throw new Error('not implemented');
};

ContentsDao.prototype.getSrs = function (contents) {
  var dao = this.getSpatialReferenceSystemDao();
  return dao.queryForIdObject(contents.srs_id);
};

ContentsDao.prototype.getGeometryColumns = function (contents, callback) {
  var dao = this.getGeometryColumnsDao();
  // TODO what is causing this to need to be here and not up in the require section
  var GeometryColumnsDao = require('../../features/columns').GeometryColumnsDao;
  dao.queryForEqWithFieldAndValue(GeometryColumnsDao.COLUMN_TABLE_NAME, contents.table_name, function(err, results) {
    if (err || !results || !results.length) return callback(err);
    var gc = dao.createObject();
    dao.populateObjectFromResult(gc, results[0]);
    callback(err, gc);
  });
};

ContentsDao.prototype.getTileMatrixSet = function (contents, callback) {
  var dao = this.getTileMatrixSetDao();
  dao.queryForEqWithFieldAndValue(TileMatrixSetDao.COLUMN_TABLE_NAME, contents.table_name, function(err, results) {
    if (err || !results || !results.length) return callback(err);
    var gc = dao.createObject();
    dao.populateObjectFromResult(gc, results[0]);
    callback(err, gc);
  });
};

ContentsDao.prototype.getTileMatrix = function (contents, callback) {
  var dao = this.getTileMatrixDao();
  dao.queryForEqWithFieldAndValue(TileMatrixDao.COLUMN_TABLE_NAME, contents.table_name, function(err, results) {
    if (err || !results || !results.length) return callback(err);
    var tileMatricies = [];
    for (var i = 0; i < results.length; i++) {
      var gc = dao.createObject();
      dao.populateObjectFromResult(gc, results[i]);
      tileMatricies.push(gc);
    }
    callback(err, tileMatricies);
  });
};

ContentsDao.prototype.getGeometryColumnsDao = function () {
  // TODO what is causing this to need to be here and not up in the require section
  var GeometryColumnsDao = require('../../features/columns').GeometryColumnsDao;
  return new GeometryColumnsDao(this.connection);
};

ContentsDao.prototype.getSpatialReferenceSystemDao = function () {
  return new SpatialReferenceSystemDao(this.connection);
};

ContentsDao.prototype.getTileMatrixSetDao = function () {
  return new TileMatrixSetDao(this.connection);
};

ContentsDao.prototype.getTileMatrixDao = function () {
  return new TileMatrixDao(this.connection);
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

ContentsDao.prototype.gpkgTableName = ContentsDao.TABLE_NAME;
ContentsDao.prototype.idColumns = [ContentsDao.COLUMN_PK];

module.exports.ContentsDao = ContentsDao;
Contents.TABLE_NAME = ContentsDao.TABLE_NAME;
module.exports.Contents = Contents;
