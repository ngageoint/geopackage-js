/**
 * GeometryIndexDao module.
 * @module geometryIndexDao
 * @see module:dao/dao
 */

var Dao = require('../../dao/dao')
  , TableIndexDao = require('./tableIndex').TableIndexDao
  , TableCreator = require('../../db/tableCreator');

var util = require('util');

/**
 * Geometry Index object, for indexing data within user tables
 * @class TableIndex
 */
var GeometryIndex = function() {

  /**
   * Name of the table
   * @member {String}
   */
  this.table_name;

  /**
   * Geometry Id column
   * @member {Number}
   */
  this.geom_id;

  /**
   * Min X
   * @member {Number}
   */
  this.min_x;

  /**
   * Max X
   * @member {Number}
   */
  this.max_x;

  /**
   * Min Y
   * @member {Number}
   */
  this.min_y;

  /**
   * Max Y
   * @member {Number}
   */
  this.max_y;

  /**
   * Min Z
   * @member {Number}
   */
  this.min_z;

  /**
   * Max Z
   * @member {Number}
   */
  this.max_z;

  /**
   * Min M
   * @member {Number}
   */
  this.min_m;

  /**
   * Max M
   * @member {Number}
   */
  this.max_m;
}

GeometryIndex.prototype.setTableIndex = function(tableIndex) {
  if (tableIndex) {
    this.table_name = tableIndex.table_name;
  } else {
    this.table_name = undefined;
  }
}

/**
 * Geometry Index Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
var GeometryIndexDao = function(connection) {
  Dao.call(this, connection);
};

util.inherits(GeometryIndexDao, Dao);

GeometryIndexDao.prototype.createObject = function() {
  return new GeometryIndexDao();
};

/**
 *  Get the Table Index of the Geometry Index
 *
 *  @param geometryIndex geometry index
 */
GeometryIndexDao.prototype.getTableIndex = function(geometryIndex, callback) {
  var dao = this.getTableIndexDao();
  dao.queryForIdObject(geometryIndex.tableName, callback);
};

GeometryIndexDao.prototype.getTableIndexDao = function() {
  return new TableIndexDao(this.connection);
};

/**
 *  Query by table name
 *
 *  @param tableName table name
 *
 *  @return geometry index results
 */
GeometryIndexDao.prototype.queryForTableName = function(tableName, eachCallback, doneCallback) {
  this.queryForEqWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, tableName, eachCallback, doneCallback);
};

/**
 *  Count by table name
 *
 *  @param tableName table name
 *
 *  @return count
 */
GeometryIndexDao.prototype.countByTableName = function(tableName, callback) {
  this.countByEqWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, tableName, callback);
};

/**
 *  Populate a new geometry index from an envelope
 *
 *  @param tableIndex table index
 *  @param geomId     geometry id
 *  @param envelope   geometry envelope
 *  @param callback called with results of the populate
 */
GeometryIndexDao.prototype.populate = function(tableIndex, geometryId, envelope) {
  var geometryIndex  = new GeometryIndex();
  geometryIndex.setTableIndex(tableIndex);
  geometryIndex.geom_id = geometryId;
  geometryIndex.min_x = envelope.minX;
  geometryIndex.min_y = envelope.minY;
  geometryIndex.max_x = envelope.maxX;
  geometryIndex.max_y = envelope.maxY;
  if (envelope.hasZ) {
    geometryIndex.min_z = envelope.minZ;
    geometryIndex.max_z = envelope.maxZ;
  }

  if (envelope.hasM) {
    geometryIndex.min_m = envelope.minM;
    geometryIndex.max_m = envelope.maxM;
  }
  return geometryIndex;
};

GeometryIndexDao.prototype.createTable = function(callback) {
  this.isTableExists(function(err, exists) {
    if (exists) return callback(err, exists);
    var tc = new TableCreator(this.connection);
    tc.createGeometryIndex(callback);
  }.bind(this));
}

GeometryIndexDao.TABLE_NAME = "nga_geometry_index";
GeometryIndexDao.COLUMN_TABLE_NAME = GeometryIndexDao.TABLE_NAME + ".table_name";
GeometryIndexDao.COLUMN_GEOM_ID = GeometryIndexDao.TABLE_NAME + ".geom_id";
GeometryIndexDao.COLUMN_MIN_X = GeometryIndexDao.TABLE_NAME + ".min_x";
GeometryIndexDao.COLUMN_MAX_X = GeometryIndexDao.TABLE_NAME + ".max_x";
GeometryIndexDao.COLUMN_MIN_Y = GeometryIndexDao.TABLE_NAME + ".min_y";
GeometryIndexDao.COLUMN_MAX_Y = GeometryIndexDao.TABLE_NAME + ".max_y";
GeometryIndexDao.COLUMN_MIN_Z = GeometryIndexDao.TABLE_NAME + ".min_z";
GeometryIndexDao.COLUMN_MAX_Z = GeometryIndexDao.TABLE_NAME + ".max_z";
GeometryIndexDao.COLUMN_MIN_M = GeometryIndexDao.TABLE_NAME + ".min_m";
GeometryIndexDao.COLUMN_MAX_M = GeometryIndexDao.TABLE_NAME + ".max_m";

GeometryIndexDao.prototype.gpkgTableName = GeometryIndexDao.TABLE_NAME;
GeometryIndexDao.prototype.idColumns = ['table_name', 'geom_id'];

module.exports.GeometryIndexDao = GeometryIndexDao;
module.exports.GeometryIndex = GeometryIndex;
