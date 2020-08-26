import { Dao } from '../../dao/dao';
import { GeometryIndex } from './geometryIndex';
import { TableCreator } from '../../db/tableCreator';
import { FeatureDao } from '../../features/user/featureDao';
import { GeoPackage } from '../../geoPackage';
import { TableIndex } from './tableIndex';
import { Envelope } from '../../geom/envelope';
import { FeatureRow } from '../../features/user/featureRow';
import { DBValue } from '../../db/dbAdapter';
/**
 * Geometry Index Data Access Object
 * @class
 * @extends Dao
 */
export class GeometryIndexDao extends Dao<GeometryIndex> {
  public static readonly TABLE_NAME: string = 'nga_geometry_index';
  public static readonly COLUMN_TABLE_NAME: string = GeometryIndexDao.TABLE_NAME + '.table_name';
  public static readonly COLUMN_GEOM_ID: string = GeometryIndexDao.TABLE_NAME + '.geom_id';
  public static readonly COLUMN_MIN_X: string = GeometryIndexDao.TABLE_NAME + '.min_x';
  public static readonly COLUMN_MAX_X: string = GeometryIndexDao.TABLE_NAME + '.max_x';
  public static readonly COLUMN_MIN_Y: string = GeometryIndexDao.TABLE_NAME + '.min_y';
  public static readonly COLUMN_MAX_Y: string = GeometryIndexDao.TABLE_NAME + '.max_y';
  public static readonly COLUMN_MIN_Z: string = GeometryIndexDao.TABLE_NAME + '.min_z';
  public static readonly COLUMN_MAX_Z: string = GeometryIndexDao.TABLE_NAME + '.max_z';
  public static readonly COLUMN_MIN_M: string = GeometryIndexDao.TABLE_NAME + '.min_m';
  public static readonly COLUMN_MAX_M: string = GeometryIndexDao.TABLE_NAME + '.max_m';

  readonly gpkgTableName: string = GeometryIndexDao.TABLE_NAME;
  readonly idColumns: string[] = ['table_name', 'geom_id'];

  featureDao: FeatureDao<FeatureRow>;
  constructor(geoPackage: GeoPackage, featureDao: FeatureDao<FeatureRow>) {
    super(geoPackage);
    this.featureDao = featureDao;
  }
  createObject(results?: Record<string, DBValue>): GeometryIndex {
    const gi = new GeometryIndex();
    if (results) {
      gi.table_name = results.table_name as string;
      gi.geom_id = results.geom_id as number;
      gi.min_x = results.min_x as number;
      gi.max_x = results.max_x as number;
      gi.min_y = results.min_y as number;
      gi.max_y = results.max_y as number;
      gi.min_z = results.min_z as number;
      gi.max_z = results.max_z as number;
      gi.min_m = results.min_m as number;
      gi.max_m = results.max_m as number;
    }
    return gi;
  }
  /**
   * Get the Table Index of the Geometry Index
   *
   * @param {module:extension/index~GeometryIndex} geometryIndex geometry index
   * @return {module:extension/index~TableIndex}
   */
  getTableIndex(geometryIndex: GeometryIndex): TableIndex {
    return this.geoPackage.tableIndexDao.queryForId(geometryIndex.table_name);
  }
  /**
   * Query by table name
   * @param  {string} tableName table name
   * @return {Iterable}
   */
  queryForTableName(tableName: string): IterableIterator<GeometryIndex> {
    return (this.queryForEach(GeometryIndexDao.COLUMN_TABLE_NAME, tableName) as unknown) as IterableIterator<
      GeometryIndex
    >;
  }

  /**
   * Count by table name
   * @param  {string}   tableName table name
   * @return {Number}
   */
  countByTableName(tableName: string): number {
    return this.count(GeometryIndexDao.COLUMN_TABLE_NAME, tableName);
  }

  /**
   * Populate a new goemetry index from an envelope
   * @param  {module:extension/index~TableIndex} tableIndex TableIndex
   * @param  {Number} geometryId id of the geometry
   * @param  {Object} envelope   envelope to store
   * @return {module:extension/index~GeometryIndex}
   */
  populate(tableIndex: TableIndex, geometryId: number, envelope: Envelope): GeometryIndex {
    const geometryIndex = new GeometryIndex();
    geometryIndex.tableIndex = tableIndex;
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
  }
  /**
   * Create the GeometryIndex table
   * @return {boolean}
   */
  createTable(): boolean {
    const exists = this.isTableExists();
    if (exists) return true;
    const tc = new TableCreator(this.geoPackage);
    return tc.createGeometryIndex();
  }
  /**
   * Query the index with an envelope
   * @param  {Object} envelope envelope
   * @param  {Number} envelope.minX min x
   * @param  {Number} envelope.maxX max x
   * @param  {Number} envelope.minY min y
   * @param  {Number} envelope.maxY max y
   * @param  {Number} envelope.minZ min z
   * @param  {Number} envelope.maxZ max z
   * @param  {Number} envelope.minM min m
   * @param  {Number} envelope.maxM max m
   * @param  {Boolean} envelope.hasM has m
   * @param  {Boolean} envelope.hasZ has z
   * @return {Object}
   */
  _generateGeometryEnvelopeQuery(
    envelope: Envelope,
  ): { join: string; where: string; whereArgs: DBValue[]; tableNameArr: string[] } {
    const tableName = this.featureDao.gpkgTableName;
    let where = '';
    where += this.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, tableName);
    where += ' and ';
    const minXLessThanMaxX = envelope.minX < envelope.maxX;
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
    const whereArgs = [tableName, envelope.maxX, envelope.minX];
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
    return {
      join:
        'inner join "' +
        tableName +
        '" on "' +
        tableName +
        '".' +
        this.featureDao.idColumns[0] +
        ' = ' +
        GeometryIndexDao.COLUMN_GEOM_ID,
      where,
      whereArgs,
      tableNameArr: ['"' + tableName + '".*'],
    };
  }

  /**
   * @param  {Object} envelope envelope
   * @param  {Number} envelope.minX min x
   * @param  {Number} envelope.maxX max x
   * @param  {Number} envelope.minY min y
   * @param  {Number} envelope.maxY max y
   * @param  {Number} envelope.minZ min z
   * @param  {Number} envelope.maxZ max z
   * @param  {Number} envelope.minM min m
   * @param  {Number} envelope.maxM max m
   * @param  {Boolean} envelope.hasM has m
   * @param  {Boolean} envelope.hasZ has z
   */
  queryWithGeometryEnvelope(envelope: Envelope): IterableIterator<GeometryIndex> {
    const result = this._generateGeometryEnvelopeQuery(envelope);
    return (this.queryJoinWhereWithArgs(
      result.join,
      result.where,
      result.whereArgs,
      result.tableNameArr,
    ) as unknown) as IterableIterator<GeometryIndex>;
  }
  /**
   * @param  {Object} envelope envelope
   * @param  {Number} envelope.minX min x
   * @param  {Number} envelope.maxX max x
   * @param  {Number} envelope.minY min y
   * @param  {Number} envelope.maxY max y
   * @param  {Number} envelope.minZ min z
   * @param  {Number} envelope.maxZ max z
   * @param  {Number} envelope.minM min m
   * @param  {Number} envelope.maxM max m
   * @param  {Boolean} envelope.hasM has m
   * @param  {Boolean} envelope.hasZ has z
   */
  countWithGeometryEnvelope(envelope: Envelope): number {
    const result = this._generateGeometryEnvelopeQuery(envelope);
    return this.countJoinWhereWithArgs(result.join, result.where, result.whereArgs);
  }
}
