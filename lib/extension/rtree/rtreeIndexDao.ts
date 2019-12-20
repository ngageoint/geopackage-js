import {Dao} from '../../dao/dao';
import RTreeIndex from './rtreeIndex';
import {FeatureDao} from '../../features/user/featureDao';
import GeoPackage from '../../geoPackage';
import { SqliteQueryBuilder } from '../../db/sqliteQueryBuilder'
/**
 * RTree module.
 */


/**
 * RTree Index Data Access Object
 * @class
 * @extends Dao
 */
export class RTreeIndexDao extends Dao<RTreeIndex> {

  public static readonly TABLE_NAME = "rtree";
  public static readonly COLUMN_TABLE_NAME = RTreeIndexDao.TABLE_NAME + ".table_name";
  public static readonly COLUMN_GEOM_ID = RTreeIndexDao.TABLE_NAME + ".geom_id";
  public static readonly COLUMN_MIN_X = RTreeIndexDao.TABLE_NAME + ".minx";
  public static readonly COLUMN_MAX_X = RTreeIndexDao.TABLE_NAME + ".maxx";
  public static readonly COLUMN_MIN_Y = RTreeIndexDao.TABLE_NAME + ".miny";
  public static readonly COLUMN_MAX_Y = RTreeIndexDao.TABLE_NAME + ".maxy";
  public static readonly COLUMN_MIN_Z = RTreeIndexDao.TABLE_NAME + ".minz";
  public static readonly COLUMN_MAX_Z = RTreeIndexDao.TABLE_NAME + ".maxz";
  public static readonly COLUMN_MIN_M = RTreeIndexDao.TABLE_NAME + ".minm";
  public static readonly COLUMN_MAX_M = RTreeIndexDao.TABLE_NAME + ".maxm";

  public static readonly EXTENSION_NAME = 'gpkg_rtree_index';
  public static readonly EXTENSION_RTREE_INDEX_AUTHOR = 'gpkg';
  public static readonly EXTENSION_RTREE_INDEX_NAME_NO_AUTHOR = 'rtree_index';
  public static readonly EXTENSION_RTREE_INDEX_DEFINITION = 'http://www.geopackage.org/spec/#extension_rtree';

  gpkgTableName = RTreeIndexDao.TABLE_NAME;
  featureDao: FeatureDao;

  constructor(geoPackage: GeoPackage, featureDao: FeatureDao) {
    super(geoPackage);
    this.featureDao = featureDao;
  }
  createObject(): RTreeIndex {
    return new RTreeIndex(this.geoPackage, this.featureDao);
  }
  /**
   * Generate query components
   * @param envelope
   * @returns {{whereArgs: Array, where: string, join: string, tableNameArr: string[]}}
   * @private
   */
  _generateGeometryEnvelopeQuery(envelope: { minX: number, maxX: number, minY: number, maxY: number}): {whereArgs: any[], where: string, join: string, tableNameArr: string[]} {
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
    const whereArgs: number[] = [];
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
  /**
   * Query witha geometry envelope
   * @param  {any} envelope envelope
   * @return {IterableIterator<any>}
   */
  queryWithGeometryEnvelope(envelope) {
    var result = this._generateGeometryEnvelopeQuery(envelope);
    return this.queryJoinWhereWithArgs(result.join, result.where, result.whereArgs, result.tableNameArr);
  }
  countWithGeometryEnvelope(envelope) {
    var result = this._generateGeometryEnvelopeQuery(envelope);
    return this.connection.get(SqliteQueryBuilder.buildCount("'" + this.gpkgTableName + "'", result.where), result.whereArgs).count;
  }
}
