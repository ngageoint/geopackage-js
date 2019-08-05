/**
 * @module extension/contents
 */

var Dao = require('../../dao/dao')
  , ColumnValues = require('../../dao/columnValues');

var util = require('util');

/**
 * Contents Id object, for maintaining a unique identifier for contents tables
 * @class ContentsId
 */
var ContentsId = function() {

  /**
   * Id column, primary key
   * @member {Number}
   */
  this.id;

  /**
   * Table name column
   * @member {String}
   */
  this.table_name;
};

/**
 * Contents Id Data Access Object
 * @class ContentsIdDao
 * @extends {module:dao/dao~Dao}
 */
var ContentsIdDao = function(geoPackage) {
  Dao.call(this, geoPackage);
};

util.inherits(ContentsIdDao, Dao);

/**
 * Create a {module:extension/contents~ContentsId} object
 * @return {module:extension/contents~ContentsId}
 */
ContentsIdDao.prototype.createObject = function() {
  return new ContentsId();
};

/**
 * Create the necessary tables for this dao
 * @return {Promise}
 */
ContentsIdDao.prototype.createTable = function() {
  return this.geoPackage.getTableCreator().createContentsId();
};

/**
 * Get all the table names
 * @return {string[]}
 */
ContentsIdDao.prototype.getTableNames = function() {
  var tableNames = [];
  var tableNameColumns = this.queryForColumns('table_name');
  for (var i = 0; i < tableNameColumns.length; i++) {
    tableNames.push(tableNameColumns[i].table_name);
  }
  return tableNames;
};

/**
 * Query by table name
 * @param  {string} tableName name of the table
 * @return {module:extension/contents~ContentsId}
 */
ContentsIdDao.prototype.queryForTableName = function(tableName) {
  var contentsIds = this.queryForAll(this.buildWhereWithFieldAndValue(ContentsIdDao.COLUMN_TABLE_NAME, tableName), this.buildWhereArgs(tableName));
  if (contentsIds.length > 0) {
    return contentsIds[0];
  } else {
    return null;
  }
};

/**
 * Delete by tableName
 * @param  {string} tableName the table name to delete by
 * @return {number} number of deleted rows
 */
ContentsIdDao.prototype.deleteByTableName = function(tableName) {
  return this.deleteWhere(this.buildWhereWithFieldAndValue(ContentsIdDao.COLUMN_TABLE_NAME, tableName), this.buildWhereArgs(tableName));
};

ContentsIdDao.TABLE_NAME = 'nga_contents_id';
ContentsIdDao.COLUMN_ID = 'id';
ContentsIdDao.COLUMN_TABLE_NAME = 'table_name';

ContentsIdDao.prototype.gpkgTableName = ContentsIdDao.TABLE_NAME;
ContentsIdDao.prototype.idColumns = ['id'];

module.exports.ContentsIdDao = ContentsIdDao;
module.exports.ContentsId = ContentsId;
