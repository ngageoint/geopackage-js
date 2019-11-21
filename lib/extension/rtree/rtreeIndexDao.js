/**
 * RTree module.
 */

var Dao = require('../../dao/dao')
  , sqliteQueryBuilder = require('../../db/sqliteQueryBuilder');


/**
 * RTree Index Data Access Object
 * @class
 * @extends Dao
 */
class RTreeIndexDao extends Dao {
  constructor(geoPackage, featureDao) {
    super(geoPackage);
    this.featureDao = featureDao;
  }
  /**
   * Generate query components
   * @param envelope
   * @returns {{whereArgs: Array, where: string, join: string, tableNameArr: string[]}}
   * @private
   */
  _generateGeometryEnvelopeQuery(envelope) {
    var tableName = this.featureDao.gpkgTableName;
    var where = '';
    var minXLessThanMaxX = envelope.minX < envelope.maxX;
    if (minXLessThanMaxX) {
      where += this.buildWhereWithFieldAndValue('minx', envelope.maxX, '<=');
      where += ' and ';
      where += this.buildWhereWithFieldAndValue('maxx', envelope.minX, '>=');
    }
    else {
      where += '(';
      where += this.buildWhereWithFieldAndValue('minx', envelope.maxX, '<=');
      where += ' or ';
      where += this.buildWhereWithFieldAndValue('maxx', envelope.minX, '>=');
      where += ' or ';
      where += this.buildWhereWithFieldAndValue('minx', envelope.minX, '>=');
      where += ' or ';
      where += this.buildWhereWithFieldAndValue('maxx', envelope.maxX, '<=');
      where += ')';
    }
    where += ' and ';
    where += this.buildWhereWithFieldAndValue('miny', envelope.maxY, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue('maxy', envelope.minY, '>=');
    var whereArgs = [];
    whereArgs.push(envelope.maxX, envelope.minX);
    if (!minXLessThanMaxX) {
      whereArgs.push(envelope.minX, envelope.maxX);
    }
    whereArgs.push(envelope.maxY, envelope.minY);
    return {
      join: 'inner join ' + tableName + ' on ' + tableName + '.' + this.featureDao.idColumns[0] + ' = ' + this.gpkgTableName + '.id',
      where,
      whereArgs,
      tableNameArr: [tableName + '.*']
    };
  }
  queryWithGeometryEnvelope(envelope) {
    var result = this._generateGeometryEnvelopeQuery(envelope);
    return this.queryJoinWhereWithArgs(result.join, result.where, result.whereArgs, result.tableNameArr);
  }
  countWithGeometryEnvelope(envelope) {
    var result = this._generateGeometryEnvelopeQuery(envelope);
    return this.connection.get(sqliteQueryBuilder.buildCount("'" + this.gpkgTableName + "'", result.where), result.whereArgs).count;
  }
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
RTreeIndexDao.EXTENSION_RTREE_INDEX_AUTHOR = 'gpkg';
RTreeIndexDao.EXTENSION_RTREE_INDEX_NAME_NO_AUTHOR = 'rtree_index';
RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION = 'http://www.geopackage.org/spec/#extension_rtree';

RTreeIndexDao.prototype.gpkgTableName = RTreeIndexDao.TABLE_NAME;

module.exports = RTreeIndexDao;
