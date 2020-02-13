import { Dao } from '../../dao/dao';
import { TableCreator } from '../../db/tableCreator';
import { TableIndex } from './tableIndex';

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
  createObject(): TableIndex {
    return new TableIndex();
  }
  /**
   * Creates the tables necessary
   * @return {Promise}
   */
  async createTable(): Promise<boolean> {
    const tc = new TableCreator(this.geoPackage);
    return tc.createTableIndex();
  }
}
