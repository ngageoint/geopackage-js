/**
 * GeometryIndexDao module.
 * @module extension/index
 */

var Dao = require('../../dao/dao')
  , TableIndexDao = require('./tableIndex').TableIndexDao
  , TableCreator = require('../../db/tableCreator');

var util = require('util');

/**
 * Geometry Index object, for indexing data within user tables
 * @class
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
  this.table_name = tableIndex.table_name;
}

/**
 * Geometry Index Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
var GeometryIndexDao = function(geoPackage, featureDao) {
  Dao.call(this, geoPackage);
  this.featureDao = featureDao;
};

util.inherits(GeometryIndexDao, Dao);

GeometryIndexDao.prototype.createObject = function() {
  return new GeometryIndex();
};

/**
 * Get the Table Index of the Geometry Index
 *
 * @param {module:extension/index~GeometryIndex} geometryIndex geometry index
 * @return {module:extension/index~TableIndex}
 */
GeometryIndexDao.prototype.getTableIndex = function(geometryIndex) {
  var dao = this.geoPackage.getTableIndexDao();
  return dao.queryForId(geometryIndex.tableName);
};

/**
 * Query by table name
 * @param  {string} tableName table name
 * @return {Iterable}
 */
GeometryIndexDao.prototype.queryForTableName = function(tableName) {
  return this.queryForEach(GeometryIndexDao.COLUMN_TABLE_NAME, tableName);
};

/**
 *  Count by table name
 *
 *  @param tableName table name
 *
 *  @return count
 */
/**
 * Count by table name
 * @param  {string}   tableName table name
 * @return {Number}
 */
GeometryIndexDao.prototype.countByTableName = function(tableName) {
  return this.count(GeometryIndexDao.COLUMN_TABLE_NAME, tableName);
};

/**
 *  Populate a new geometry index from an envelope
 *
 *  @param tableIndex table index
 *  @param geomId     geometry id
 *  @param envelope   geometry envelope
 *  @param callback called with results of the populate
 */
/**
 * Populate a new goemetry index from an envelope
 * @param  {module:extension/index~TableIndex} tableIndex TableIndex
 * @param  {Number} geometryId id of the geometry
 * @param  {Object} envelope   envelope to store
 * @return {module:extension/index~GeometryIndex}
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

/**
 * Create the GeometryIndex table
 * @return {Promise}
 */
GeometryIndexDao.prototype.createTable = function() {
  var exists = this.isTableExists();
  if (exists) return Promise.resolve(true);
  var tc = new TableCreator(this.geoPackage);
  return tc.createGeometryIndex();
}

/**
 * Query the index with an envelope
 * @param  {Object} envelope envelope
 * @param  {Number} envelope.minX min x
 * @param  {Number} envelope.maxX max x
 * @param  {Number} envelope.minY min y
 * @param  {Number} envelope.maxY max y
 * @return {Iterable}
 */
GeometryIndexDao.prototype.queryWithGeometryEnvelope = function(envelope) {
  var tableName = this.featureDao.gpkgTableName;
  var where = '';
  where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, tableName);
  where += ' and ';
  var minXLessThanMaxX = envelope.minX < envelope.maxX;
  if (minXLessThanMaxX) {
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MIN_X, envelope.maxX, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MAX_X, envelope.minX, '>=');
  } else {
    where += '(';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MIN_X, envelope.maxX, '<=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MAX_X, envelope.minX, '>=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MIN_X, envelope.minX, '>=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MAX_X, envelope.maxX, '<=');
    where += ')';
  }

  where += ' and ';
  where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MIN_Y, envelope.maxY, '<=');
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MAX_Y, envelope.minY, '>=');

  var whereArgs = [tableName, envelope.maxX, envelope.minX];
  if (!minXLessThanMaxX) {
    whereArgs.push(envelope.minX, envelope.maxX);
  }
  whereArgs.push(envelope.maxY, envelope.minY);
  if (envelope.hasZ) {
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MIN_Z, envelope.minZ, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MAX_Z, envelope.maxZ, '>=');
    whereArgs.push(envelope.maxZ, envelope.minZ);
  }

  if (envelope.hasM) {
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MIN_M, envelope.minM, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_MAX_M, envelope.maxM, '>=');
    whereArgs.push(envelope.maxM, envelope.minM);
  }

  var join = 'inner join "' + tableName + '" on "' + tableName + '".' + this.featureDao.idColumns[0] + ' = ' + GeometryIndexDao.COLUMN_GEOM_ID;
  return this.queryJoinWhereWithArgs(join, where, whereArgs, ['"' + tableName + '".*']);
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
