import { Dao } from '../../dao/dao';
import { RTreeIndex } from './rtreeIndex';
import { FeatureDao } from '../../features/user/featureDao';
import { GeoPackage } from '../../geoPackage';
import { SqliteQueryBuilder } from '../../db/sqliteQueryBuilder';
import { FeatureRow } from '../../features/user/featureRow';
/**
 * RTree module.
 */

/**
 * RTree Index Data Access Object
 * @class
 * @extends Dao
 */
export class RTreeIndexDao extends Dao<RTreeIndex> {
  public static readonly TABLE_NAME: string = 'rtree';
  public static readonly COLUMN_TABLE_NAME: string = RTreeIndexDao.TABLE_NAME + '.table_name';
  public static readonly COLUMN_GEOM_ID: string = RTreeIndexDao.TABLE_NAME + '.geom_id';
  public static readonly COLUMN_MIN_X: string = RTreeIndexDao.TABLE_NAME + '.minx';
  public static readonly COLUMN_MAX_X: string = RTreeIndexDao.TABLE_NAME + '.maxx';
  public static readonly COLUMN_MIN_Y: string = RTreeIndexDao.TABLE_NAME + '.miny';
  public static readonly COLUMN_MAX_Y: string = RTreeIndexDao.TABLE_NAME + '.maxy';
  public static readonly COLUMN_MIN_Z: string = RTreeIndexDao.TABLE_NAME + '.minz';
  public static readonly COLUMN_MAX_Z: string = RTreeIndexDao.TABLE_NAME + '.maxz';
  public static readonly COLUMN_MIN_M: string = RTreeIndexDao.TABLE_NAME + '.minm';
  public static readonly COLUMN_MAX_M: string = RTreeIndexDao.TABLE_NAME + '.maxm';

  public static readonly EXTENSION_NAME: string = 'gpkg_rtree_index';
  public static readonly EXTENSION_RTREE_INDEX_AUTHOR: string = 'gpkg';
  public static readonly EXTENSION_RTREE_INDEX_NAME_NO_AUTHOR: string = 'rtree_index';
  public static readonly EXTENSION_RTREE_INDEX_DEFINITION: string = 'http://www.geopackage.org/spec/#extension_rtree';

  gpkgTableName = RTreeIndexDao.TABLE_NAME;
  featureDao: FeatureDao<FeatureRow>;

  constructor(geoPackage: GeoPackage, featureDao: FeatureDao<FeatureRow>) {
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
  _generateGeometryEnvelopeQuery(envelope: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }): { whereArgs: any[]; where: string; join: string; tableNameArr: string[] } {
    const tableName = this.featureDao.gpkgTableName;
    let where = '';
    const minXLessThanMaxX = envelope.minX < envelope.maxX;
    if (minXLessThanMaxX) {
      where += this.buildWhereWithFieldAndValue('minx', envelope.maxX, '<=');
      where += ' and ';
      where += this.buildWhereWithFieldAndValue('maxx', envelope.minX, '>=');
    } else {
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
      join:
        'inner join ' +
        tableName +
        ' on ' +
        tableName +
        '.' +
        this.featureDao.idColumns[0] +
        ' = ' +
        this.gpkgTableName +
        '.id',
      where,
      whereArgs,
      tableNameArr: [tableName + '.*'],
    };
  }
  /**
   * Query witha geometry envelope
   * @param  {any} envelope envelope
   * @return {IterableIterator<any>}
   */
  queryWithGeometryEnvelope(envelope: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }): IterableIterator<any> {
    const result = this._generateGeometryEnvelopeQuery(envelope);
    return this.queryJoinWhereWithArgs(result.join, result.where, result.whereArgs, result.tableNameArr);
  }
  countWithGeometryEnvelope(envelope: { minX: number; maxX: number; minY: number; maxY: number }): number {
    const result = this._generateGeometryEnvelopeQuery(envelope);
    return this.connection.get(
      SqliteQueryBuilder.buildCount("'" + this.gpkgTableName + "'", result.where),
      result.whereArgs,
    ).count;
  }
}
