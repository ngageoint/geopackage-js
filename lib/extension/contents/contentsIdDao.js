/**
 * @memberOf module:extension/contents
 * @class ContentsIdDao
 */

var Dao = require('../../dao/dao')
  , ContentsId = require('./contentsId');

/**
 * Contents Id Data Access Object
 * @constructor
 * @extends Dao
 */
class ContentsIdDao extends Dao {
  /**
   * Create a {module:extension/contents.ContentsId} object
   * @return {module:extension/contents.ContentsId}
   */
  createObject() {
    return new ContentsId();
  }
  /**
   * Create the necessary tables for this dao
   * @return {Promise}
   */
  createTable() {
    return this.geoPackage.getTableCreator().createContentsId();
  }
  /**
   * Get all the table names
   * @return {string[]}
   */
  getTableNames() {
    var tableNames = [];
    var tableNameColumns = this.queryForColumns('table_name');
    for (var i = 0; i < tableNameColumns.length; i++) {
      tableNames.push(tableNameColumns[i].table_name);
    }
    return tableNames;
  }
  /**
   * Query by table name
   * @param  {string} tableName name of the table
   * @return {module:extension/contents.ContentsId}
   */
  queryForTableName(tableName) {
    var contentsIds = this.queryForAll(this.buildWhereWithFieldAndValue(ContentsIdDao.COLUMN_TABLE_NAME, tableName), this.buildWhereArgs(tableName));
    if (contentsIds.length > 0) {
      return contentsIds[0];
    }
    else {
      return null;
    }
  }
  /**
   * Delete by tableName
   * @param  {string} tableName the table name to delete by
   * @return {number} number of deleted rows
   */
  deleteByTableName(tableName) {
    return this.deleteWhere(this.buildWhereWithFieldAndValue(ContentsIdDao.COLUMN_TABLE_NAME, tableName), this.buildWhereArgs(tableName));
  }
}

ContentsIdDao.TABLE_NAME = 'nga_contents_id';
ContentsIdDao.COLUMN_ID = 'id';
ContentsIdDao.COLUMN_TABLE_NAME = 'table_name';

ContentsIdDao.prototype.gpkgTableName = ContentsIdDao.TABLE_NAME;
ContentsIdDao.prototype.idColumns = ['id'];

module.exports = ContentsIdDao;
