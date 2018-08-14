/**
 * RTreeIndexDao module.
 * @module RTreeIndexDao
 * @see module:dao/dao
 */

var Dao = require('../../dao/dao')
  , TableIndexDao = require('./tableIndex').TableIndexDao
  , TableCreator = require('../../db/tableCreator');

var util = require('util');

/**
 * RTree Index Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
var RTreeIndexDao = function(connection, featureDao) {
  Dao.call(this, connection);
  this.featureDao = featureDao;
};

util.inherits(RTreeIndexDao, Dao);

RTreeIndexDao.prototype.queryWithGeometryEnvelope = function(envelope) {
  var tableName = this.featureDao.gpkgTableName;

  var where = '';
  var minXLessThanMaxX = envelope.minX < envelope.maxX;
  if (minXLessThanMaxX) {
    where += this.buildWhereWithFieldAndValueAndOperation('minx', envelope.maxX, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValueAndOperation('maxx', envelope.minX, '>=');
  } else {
    where += '(';
    where += this.buildWhereWithFieldAndValueAndOperation('minx', envelope.maxX, '<=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValueAndOperation('maxx', envelope.minX, '>=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValueAndOperation('minx', envelope.minX, '>=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValueAndOperation('maxx', envelope.maxX, '<=');
    where += ')';
  }

  where += ' and ';
  where += this.buildWhereWithFieldAndValueAndOperation('miny', envelope.maxY, '<=');
  where += ' and ';
  where += this.buildWhereWithFieldAndValueAndOperation('maxy', envelope.minY, '>=');

  var whereArgs = []
  whereArgs.push(envelope.maxX, envelope.minX);
  if (!minXLessThanMaxX) {
    whereArgs.push(envelope.minX, envelope.maxX);
  }
  whereArgs.push(envelope.maxY, envelope.minY);

  var join = 'inner join ' + tableName + ' on ' + tableName + '.' + this.featureDao.idColumns[0] + ' = ' + this.gpkgTableName+'.id';
  return this.queryJoinWhereWithArgs(join, where, whereArgs, [tableName + '.*']);
}

/**
 *  Populate a new RTree index from an envelope
 *
 *  @param tableIndex table index
 *  @param geomId     RTree id
 *  @param envelope   RTree envelope
 *  @param callback called with results of the populate
 */
RTreeIndexDao.prototype.populate = function(tableIndex, RTreeId, envelope) {
  // var RTreeIndex  = new RTreeIndex();
  // RTreeIndex.setTableIndex(tableIndex);
  // RTreeIndex.geom_id = RTreeId;
  // RTreeIndex.min_x = envelope.minX;
  // RTreeIndex.min_y = envelope.minY;
  // RTreeIndex.max_x = envelope.maxX;
  // RTreeIndex.max_y = envelope.maxY;
  // if (envelope.hasZ) {
  //   RTreeIndex.min_z = envelope.minZ;
  //   RTreeIndex.max_z = envelope.maxZ;
  // }
  //
  // if (envelope.hasM) {
  //   RTreeIndex.min_m = envelope.minM;
  //   RTreeIndex.max_m = envelope.maxM;
  // }
  // return RTreeIndex;
};

RTreeIndexDao.prototype.createTable = function() {
  // var exists = this.isTableExists();
  // if (exists) return Promise.resolve(true);
  // var tc = new TableCreator(this.connection);
  // return tc.createRTreeIndex();
}

RTreeIndexDao.TABLE_NAME = "rtree";
RTreeIndexDao.COLUMN_TABLE_NAME = RTreeIndexDao.TABLE_NAME + ".table_name";
RTreeIndexDao.COLUMN_GEOM_ID = RTreeIndexDao.TABLE_NAME + ".geom_id";
RTreeIndexDao.COLUMN_MIN_X = RTreeIndexDao.TABLE_NAME + ".minx";
RTreeIndexDao.COLUMN_MAX_X = RTreeIndexDao.TABLE_NAME + ".maxx";
RTreeIndexDao.COLUMN_MIN_Y = RTreeIndexDao.TABLE_NAME + ".miny";
RTreeIndexDao.COLUMN_MAX_Y = RTreeIndexDao.TABLE_NAME + ".maxy";
RTreeIndexDao.COLUMN_MIN_Z = RTreeIndexDao.TABLE_NAME + ".minz";
RTreeIndexDao.COLUMN_MAX_Z = RTreeIndexDao.TABLE_NAME + ".maxz";
RTreeIndexDao.COLUMN_MIN_M = RTreeIndexDao.TABLE_NAME + ".minm";
RTreeIndexDao.COLUMN_MAX_M = RTreeIndexDao.TABLE_NAME + ".maxm";
RTreeIndexDao.EXTENSION_NAME = 'gpkg_rtree_index';

RTreeIndexDao.prototype.gpkgTableName = RTreeIndexDao.TABLE_NAME;

module.exports.RTreeIndexDao = RTreeIndexDao;
