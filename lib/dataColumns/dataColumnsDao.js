/**
 * DataColumns module.
 * @module dataColumns
 */

var Dao = require('../dao/dao')
  , ContentsDao = require('../core/contents/contentsDao')
  , DataColumns = require('./dataColumns');

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class
 * @extends Dao
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 */
class DataColumnsDao extends Dao {
  /**
   * Creates a new {module:dataColumns~DataColumns} object
   * @return {module:dataColumns~DataColumns}
   */
  createObject() {
    return new DataColumns();
  }
  /**
   * Get the Contents from the Data Columns
   * @param  {module:dataColumns~DataColumns} dataColumns data columns
   * @return {module:core/contents~Contents}             contents
   */
  getContents(dataColumns) {
    var cd = new ContentsDao(this.geoPackage);
    return cd.queryForId(dataColumns.table_name);
  }
  /**
   * Query by constraint name
   * @param  {String} constraintName     constraint name
   * @return {Iterable.<Object>} iterator of database objects
   */
  queryByConstraintName(constraintName) {
    return this.queryForEach(DataColumnsDao.COLUMN_CONSTRAINT_NAME, constraintName);
  }
  /**
   * Get DataColumn by column name and table name
   * @param  {String} tableName  table name
   * @param  {String} columnName column name
   * @return {module:dataColumns~DataColumns} 
   */
  getDataColumns(tableName, columnName) {
    var exists = this.isTableExists();
    if (!exists) {
      return;
    }
    var where = this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_TABLE_NAME, tableName) +
      ' and ' +
      this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_COLUMN_NAME, columnName);
    var values = [tableName, columnName];
    var dataColumn;
    for (var row of this.queryWhere(where, values)) {
      dataColumn = row;
    }
    return dataColumn;
  }
}

DataColumnsDao.TABLE_NAME = "gpkg_data_columns";
DataColumnsDao.COLUMN_PK1 = "table_name";
DataColumnsDao.COLUMN_PK2 = "column_name";
DataColumnsDao.COLUMN_TABLE_NAME = "table_name";
DataColumnsDao.COLUMN_COLUMN_NAME = "column_name";
DataColumnsDao.COLUMN_NAME = "name";
DataColumnsDao.COLUMN_TITLE = "title";
DataColumnsDao.COLUMN_DESCRIPTION = "description";
DataColumnsDao.COLUMN_MIME_TYPE = "mime_type";
DataColumnsDao.COLUMN_CONSTRAINT_NAME = "constraint_name";

DataColumnsDao.prototype.gpkgTableName = DataColumnsDao.TABLE_NAME;
DataColumnsDao.prototype.idColumns = [DataColumnsDao.COLUMN_PK1, DataColumnsDao.COLUMN_PK2];

module.exports = DataColumnsDao;
