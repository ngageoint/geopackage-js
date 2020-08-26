import { Dao } from '../../dao/dao';
import { TableCreator } from '../../db/tableCreator';
import { TableIndex } from './tableIndex';
import { DBValue } from '../../db/dbAdapter';

/**
 * Table Index Data Access Object
 * @class
 * @extends Dao
 * @param {module:geoPackage~GeoPackage}  geoPackage The GeoPackage object
 */
export class TableIndexDao extends Dao<TableIndex> {
  public static readonly TABLE_NAME: string = 'nga_table_index';
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';
  public static readonly COLUMN_LAST_INDEXED: string = 'last_indexed';

  readonly gpkgTableName: string = TableIndexDao.TABLE_NAME;
  readonly idColumns: string[] = [TableIndexDao.COLUMN_TABLE_NAME];

  /**
   * Create a new TableIndex object
   * @return {module:extension/index~TableIndex}
   */
  createObject(results?: Record<string, DBValue>): TableIndex {
    const ti = new TableIndex();
    if (results) {
      ti.table_name = results.table_name as string;
      ti.last_indexed = results.last_indexed as string;
    }
    return ti;
  }
  /**
   * Creates the tables necessary
   * @return {boolean}
   */
  createTable(): boolean {
    const tc = new TableCreator(this.geoPackage);
    return tc.createTableIndex();
  }
}
