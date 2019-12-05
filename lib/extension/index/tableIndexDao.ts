import Dao from '../../dao/dao';

var TableCreator = require('../../db/tableCreator')
  , TableIndex = require('./tableIndex').default;

/**
 * Table Index Data Access Object
 * @class
 * @extends Dao
 * @param {module:geoPackage~GeoPackage}  geoPackage The GeoPackage object
 */
export default class TableIndexDao extends Dao<typeof TableIndex> {

  public static readonly TABLE_NAME = "nga_table_index";
  public static readonly COLUMN_TABLE_NAME = "table_name";
  public static readonly COLUMN_LAST_INDEXED = "last_indexed";

  readonly gpkgTableName = TableIndexDao.TABLE_NAME;
  readonly idColumns = [TableIndexDao.COLUMN_TABLE_NAME];

  /**
   * Create a new TableIndex object
   * @return {module:extension/index~TableIndex}
   */
  createObject() {
    return new TableIndex();
  }
  getGeometryIndices() {
  }
  getGeometryIndexCount() {
  }
  /**
   * Creates the tables necessary
   * @return {Promise}
   */
  createTable() {
    var tc = new TableCreator(this.geoPackage);
    return tc.createTableIndex();
  }
}