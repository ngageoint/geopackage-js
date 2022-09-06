import { ContentsId } from './contentsId';
import { DBValue } from '../../../db/dbValue';
import { GeoPackageDao } from '../../../db/geoPackageDao';
import type { GeoPackage } from '../../../geoPackage';

/**
 * Contents Id Data Access Object
 */
export class ContentsIdDao extends GeoPackageDao<ContentsId, number> {
  readonly gpkgTableName: string = ContentsId.TABLE_NAME;
  readonly idColumns: string[] = ['id'];
  /**
   * Constructor
   * @param geoPackage GeoPackage object this dao belongs to
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage, ContentsId.TABLE_NAME);
  }

  /**
   * Creates a ContentsIdDao
   * @param geoPackage
   */
  public static createDao(geoPackage: GeoPackage): ContentsIdDao {
    return new ContentsIdDao(geoPackage);
  }

  /**
   * Create a {module:extension/nga/contents.ContentsId} object
   * @return {module:extension/nga/contents.ContentsId}
   */
  createObject(results?: Record<string, DBValue>): ContentsId {
    const c = new ContentsId();
    if (results) {
      c.setId(results.id as number);
      c.setTableName(results.table_name as string);
    }
    return c;
  }

  /**
   * Get the contents for the contents id table
   * @param contentsId
   */
  public getContents(contentsId: ContentsId) {
    return this.geoPackage.getContentsDao().queryForIdWithKey(contentsId.getTableName());
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
}
