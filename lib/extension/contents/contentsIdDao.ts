import { Dao } from '../../dao/dao';
import { ContentsId } from './contentsId';
import { DBValue } from '../../db/dbAdapter';

/**
 * Contents Id Data Access Object
 * @constructor
 * @extends Dao
 */
export class ContentsIdDao extends Dao<ContentsId> {
  public static readonly TABLE_NAME: string = 'nga_contents_id';
  public static readonly COLUMN_ID: string = 'id';
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';

  readonly gpkgTableName: string = ContentsIdDao.TABLE_NAME;
  readonly idColumns: string[] = ['id'];
  /**
   * Create a {module:extension/contents.ContentsId} object
   * @return {module:extension/contents.ContentsId}
   */
  createObject(results?: Record<string, DBValue>): ContentsId {
    const c = new ContentsId();
    if (results) {
      c.id = results.id as number;
      c.table_name = results.table_name as string;
    }
    return c;
  }
  /**
   * Create the necessary tables for this dao
   * @return {Promise}
   */
  createTable(): Promise<boolean> {
    return this.geoPackage.getTableCreator().createContentsId();
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
   * @return {module:extension/contents.ContentsId}
   */
  queryForTableName(tableName: string): ContentsId {
    const contentsIds = this.queryForAll(
      this.buildWhereWithFieldAndValue(ContentsIdDao.COLUMN_TABLE_NAME, tableName),
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
      this.buildWhereWithFieldAndValue(ContentsIdDao.COLUMN_TABLE_NAME, tableName),
      this.buildWhereArgs(tableName),
    );
  }
}
