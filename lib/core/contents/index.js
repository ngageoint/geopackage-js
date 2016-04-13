/**
 * Contents module.
 * @module core/contents
 * @see module:dao/dao
 */

var Dao = require('../../dao/dao')
  , GeometryColumnsDao = require('../../features/columns').GeometryColumnsDao
  , SpatialReferenceSystemDao = require('../srs').SpatialReferenceSystemDao;

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
  this.tableName;

  /**
   * Type of data stored in the table:. “features” per clause Features,
   * “tiles” per clause Tiles, or an implementer-defined value for other data
   * tables per clause in an Extended GeoPackage.
   * @member {string}
   */
  this.dataType;

  /**
   * A human-readable identifier (e.g. short name) for the table_name content
   * @member {string}
   */
  this.identifier;

  /**
   * A human-readable description for the table_name content
   * @member {string}
   */
  this.theDescription;

  /**
   * timestamp value in ISO 8601 format as defined by the strftime function
   * %Y-%m-%dT%H:%M:%fZ format string applied to the current time
   * @member {Date}
   */
  this.lastChange;

  /**
   * Bounding box minimum easting or longitude for all content in table_name
   * @member {Number}
   */
  this.minX;

  /**
   * Bounding box minimum northing or latitude for all content in table_name
   * @member {Number}
   */
  this.minY;

  /**
   * Bounding box maximum easting or longitude for all content in table_name
   * @member {Number}
   */
  this.maxX;

  /**
   * Bounding box maximum northing or latitude for all content in table_name
   * @member {Number}
   */
  this.maxY;

  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   * @member {Number}
   */
  this.srsId;
}

Contents.prototype.populateFromResult = function (result) {
  for (var key in ContentsDao.columnToPropertyMap) {
    this[ContentsDao.columnToPropertyMap[key]] = result[key];
  }
};

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class
 * @extends {module:dao/dao~Dao}
 */
var ContentsDao = function(db) {
  Dao.call(this, db);
  this.initializeColumnIndex();
}

util.inherits(ContentsDao, Dao);

ContentsDao.prototype.createObject = function () {
  return new Contents();
};

ContentsDao.prototype.setValueInObject = function (object, columnIndex, value) {
  var propertyName = Contents.columnIndexToPropertyMap[columnIndex];
  if (!propertyName) {
    throw new Error('Unsupported column index: ' + columnIndex);
  }
  object[Contents.columnIndexToPropertyMap[columnIndex]] = value;
};

ContentsDao.prototype.getValueFromObject = function (object, columnIndex) {
  var propertyName = Contents.columnIndexToPropertyMap[columnIndex];
  if (!propertyName) {
    throw new Error('Unsupported column index: ' + columnIndex);
  }
  return object[Contents.columnIndexToPropertyMap[columnIndex]];
};

ContentsDao.prototype.getProjection = function (projectionObject) {
  var srs = this.getSrs(projectionObject);
  var srsDao = this.getSpatialReferenceSystemDao();
  var projection = srsDao.getProjection(srs);
  return projection;
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

ContentsDao.prototype.deleteByIdsCascadeWithUserTable = function (idColleciton, userTable) {
  throw new Error('not implemented');
};

ContentsDao.prototype.deleteTable = function (tableName) {
  throw new Error('not implemented');
};

ContentsDao.prototype.getSrs = function (contents, callback) {
  var dao = this.getSpatialReferenceSystemDao();
  dao.queryForIdObject(contents.srsId, function(err, result) {
    // TODO make the object here
    callback(err, result);
  });
};

ContentsDao.prototype.getGeometryColumns = function (contents, callback) {
  var dao = this.getGeometryColumnsDao();
  dao.queryForEqWithFieldAndValue(ContentsDao.GPKG_GC_COLUMN_TABLE_NAME, contents.tableName, function(err, results) {
    // TODO make the object here
    callback(err, results[0]);
  });
};

ContentsDao.prototype.getTileMatrixSet = function (contents, callback) {
  throw new Error('not implemented');
};

ContentsDao.prototype.getTileMatrix = function (contents, callback) {
  throw new Error('not implemented');
};

ContentsDao.prototype.getGeometryColumnsDao = function () {
  return new GeometryColumnsDao(this.connection);
};

ContentsDao.prototype.getSpatialReferenceSystemDao = function () {
  return new SpatialReferenceSystemDao(this.connection);
};

ContentsDao.prototype.getTileMatrixSetDao = function () {
  throw new Error('not implemented');
};

ContentsDao.prototype.getTileMatrixDao = function () {
  throw new Error('not implemented');
};

Contents.TABLE_NAME = "tableName";
Contents.DATA_TYPE = "dataType";
Contents.IDENTIFIER = "identifier";
Contents.DESCRIPTION = "description";
Contents.LAST_CHANGE = "lastChange";
Contents.MIN_X = "minX";
Contents.MIN_Y = "minY";
Contents.MAX_X = "maxX";
Contents.MAX_Y = "maxY";
Contents.SRS_ID = "srsId";

ContentsDao.GPKG_CON_TABLE_NAME = "gpkg_contents";
ContentsDao.GPKG_CON_COLUMN_PK = "table_name";
ContentsDao.GPKG_CON_COLUMN_TABLE_NAME = "table_name";
ContentsDao.GPKG_CON_COLUMN_DATA_TYPE = "data_type";
ContentsDao.GPKG_CON_COLUMN_IDENTIFIER = "identifier";
ContentsDao.GPKG_CON_COLUMN_DESCRIPTION = "description";
ContentsDao.GPKG_CON_COLUMN_LAST_CHANGE = "last_change";
ContentsDao.GPKG_CON_COLUMN_MIN_X = "min_x";
ContentsDao.GPKG_CON_COLUMN_MIN_Y = "min_y";
ContentsDao.GPKG_CON_COLUMN_MAX_X = "max_x";
ContentsDao.GPKG_CON_COLUMN_MAX_Y = "max_y";
ContentsDao.GPKG_CON_COLUMN_SRS_ID = "srs_id";

ContentsDao.GPKG_CDT_FEATURES_NAME = "features";
ContentsDao.GPKG_CDT_TILES_NAME = "tiles";

ContentsDao.prototype.tableName = ContentsDao.GPKG_CON_TABLE_NAME;
ContentsDao.prototype.idColumns = [ContentsDao.GPKG_CON_COLUMN_PK];
ContentsDao.prototype.columns = [ContentsDao.GPKG_CON_COLUMN_TABLE_NAME, ContentsDao.GPKG_CON_COLUMN_DATA_TYPE, ContentsDao.GPKG_CON_COLUMN_IDENTIFIER, ContentsDao.GPKG_CON_COLUMN_DESCRIPTION, ContentsDao.GPKG_CON_COLUMN_LAST_CHANGE, ContentsDao.GPKG_CON_COLUMN_MIN_X, ContentsDao.GPKG_CON_COLUMN_MIN_Y, ContentsDao.GPKG_CON_COLUMN_MAX_X, ContentsDao.GPKG_CON_COLUMN_MAX_Y, ContentsDao.GPKG_CON_COLUMN_SRS_ID];

ContentsDao.columnToPropertyMap = {};
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_TABLE_NAME] = Contents.TABLE_NAME;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_DATA_TYPE] = Contents.DATA_TYPE;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_IDENTIFIER] = Contents.IDENTIFIER;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_DESCRIPTION] = Contents.DESCRIPTION;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_LAST_CHANGE] = Contents.LAST_CHANGE;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_MIN_X] = Contents.MIN_X;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_MIN_Y] = Contents.MIN_Y;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_MAX_X] = Contents.MAX_X;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_MAX_Y] = Contents.MAX_Y;
ContentsDao.columnToPropertyMap[ContentsDao.GPKG_CON_COLUMN_SRS_ID] = Contents.SRS_ID;


ContentsDao.columnIndexToPropertyMap = [Contents.TABLE_NAME, Contents.DATA_TYPE, Contents.IDENTIFIER, Contents.DESCRIPTION, Contents.LAST_CHANGE, Contents.MIN_X, Contents.MIN_Y, Contents.MAX_X, Contents.MAX_Y, Contents.SRS_ID];

module.exports.ContentsDao = ContentsDao;
module.exports.Contents = Contents;
