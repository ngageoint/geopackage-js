import { ContentsId } from './contentsId';
import { DBValue } from '../../../db/dbAdapter';
import { GeoPackageDao } from '../../../db/geoPackageDao';
import { ContentsDao } from '../../../contents/contentsDao';
import { GeoPackageConnection } from '../../../db/geoPackageConnection';

/**
 * Contents Id Data Access Object
 * @constructor
 * @extends Dao
 */
export class ContentsIdDao extends GeoPackageDao<ContentsId, number> {
  private contentsDao;
  readonly gpkgTableName: string = ContentsId.TABLE_NAME;
  readonly idColumns: string[] = ['id'];
  /**
   * Constructor
   * @param geoPackageConnection GeoPackage object this dao belongs to
   */
  constructor(geoPackageConnection: GeoPackageConnection) {
    super(geoPackageConnection, ContentsId.TABLE_NAME);
  }

  /**
   * Creates a ContentsIdDao
   * @param geoPackageConnection
   */
  public static createDao(geoPackageConnection: GeoPackageConnection): ContentsIdDao {
    return new ContentsIdDao(geoPackageConnection);
  }

  /**
   * Create a {module:extension/nga/contents.ContentsId} object
   * @return {module:extension/nga/contents.ContentsId}
   */
  createObject(results?: Record<string, DBValue>): ContentsId {
    const c = new ContentsId();
    if (results) {
      c.setId(results.id as number);
      const tableName = results.table_name as string;
      const contents = this.getContentsDao().queryForIdWithKey(tableName);
      c.setContents(contents);
    }
    return c;
  }

  queryForIdWithKey(key: number): ContentsId {
    return this.queryForId(key);
  }

  /**
   * Get all the table names
   * @return {string[]}
   */
  getTableNames(): string[] {
    const tableNames = [];
    const tableNameColumns = this.queryForColumns('table_name');
    for (let i = 0; i < tableNameColumns.length; i++) {
      tableNames.push(tableNameColumns[i].table_name as string);
    }
    return tableNames;
  }
  /**
   * Query by table name
   * @param  {string} tableName name of the table
   * @return {module:extension/nga/contents.ContentsId}
   */
  queryForTableName(tableName: string): ContentsId {
    const contentsIds = this.queryForAll(
      this.buildWhereWithFieldAndValue(ContentsId.COLUMN_TABLE_NAME, tableName),
      this.buildWhereArgs(tableName),
    );
    if (contentsIds.length > 0) {
      return (contentsIds[0] as unknown) as ContentsId;
    } else {
      return null;
    }
  }
  /**
   * Delete by tableName
   * @param  {string} tableName the table name to delete by
   * @return {number} number of deleted rows
   */
  deleteByTableName(tableName: string): number {
    return this.deleteWhere(
      this.buildWhereWithFieldAndValue(ContentsId.COLUMN_TABLE_NAME, tableName),
      this.buildWhereArgs(tableName),
    );
  }

  private getContentsDao(): ContentsDao {
    if (this.contentsDao == null) {
      this.contentsDao = ContentsDao.createDao(this.db);
    }
    return this.contentsDao;
  }
}
