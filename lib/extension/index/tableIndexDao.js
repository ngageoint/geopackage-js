var Dao = require('../../dao/dao')
  , TableCreator = require('../../db/tableCreator')
  , TableIndex = require('./tableIndex').default;

/**
 * Table Index Data Access Object
 * @class
 * @extends Dao
 * @param {module:geoPackage~GeoPackage}  geoPackage The GeoPackage object
 */
class TableIndexDao extends Dao {
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

TableIndexDao.TABLE_NAME = "nga_table_index";
TableIndexDao.COLUMN_TABLE_NAME = "table_name";
TableIndexDao.COLUMN_LAST_INDEXED = "last_indexed";

TableIndexDao.prototype.gpkgTableName = TableIndexDao.TABLE_NAME;
TableIndexDao.prototype.idColumns = [TableIndexDao.COLUMN_TABLE_NAME];

module.exports = TableIndexDao;