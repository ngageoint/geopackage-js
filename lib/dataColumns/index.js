/**
 * DataColumns module.
 * @module dataColumns
 */

var Dao = require('../dao/dao')
  , ContentsDao = require('../core/contents').ContentsDao;

var util = require('util');

/**
 * Stores minimal application schema identifying, descriptive and MIME type
 * information about columns in user vector feature and tile matrix data tables
 * that supplements the data available from the SQLite sqlite_master table and
 * pragma table_info(table_name) SQL function. The gpkg_data_columns data CAN be
 * used to provide more specific column data types and value ranges and
 * application specific structural and semantic information to enable more
 * informative user menu displays and more effective user decisions on the
 * suitability of GeoPackage contents for specific purposes.
 * @class DataColumns
 */
var DataColumns = function() {
  /**
   * the name of the tiles, or feature table
   * @member {string}
   */
  this.table_name;

  /**
   * the name of the table column
   * @member {string}
   */
  this.column_name;

  /**
   * A human-readable identifier (e.g. short name) for the column_name content
   * @member {string}
   */
  this.name;

  /**
   * A human-readable formal title for the column_name content
   * @member {string}
   */
  this.title;

  /**
   * A human-readable description for the table_name contente
   * @member {string}
   */
  this.description;

  /**
   * MIME type of columnName if BLOB type or NULL for other types
   * @member {string}
   */
  this.mime_type;

  /**
   * Case sensitive column value constraint name specified
   */
  this.constraint_name;
}

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @extends {module:dao/dao~Dao}
 */
var DataColumnsDao = function(geoPackage) {
  Dao.call(this, geoPackage);
}

util.inherits(DataColumnsDao, Dao);

/**
 * Creates a new {module:dataColumns~DataColumns} object
 * @return {module:dataColumns~DataColumns}
 */
DataColumnsDao.prototype.createObject = function () {
  return new DataColumns();
};

/**
 * Get the Contents from the Data Columns
 * @param  {module:dataColumns~DataColumns} dataColumns data columns
 * @return {module:core/contents~Contents}             contents
 */
DataColumnsDao.prototype.getContents = function (dataColumns) {
  var cd = new ContentsDao(this.geoPackage);
  return cd.queryForId(dataColumns.table_name);
};

/**
 * Query by constraint name
 * @param  {String} constraintName     constraint name
 * @return {Iterator} iterator of database objects
 */
DataColumnsDao.prototype.queryByConstraintName = function (constraintName) {
  return this.queryForEach(DataColumnsDao.COLUMN_CONSTRAINT_NAME, constraintName);
};

/**
 * Get DataColumn by column name and table name
 * @param  {String} tableName  table name
 * @param  {String} columnName column name
 * @return {module:dataColumns~DataColumns}
 */
DataColumnsDao.prototype.getDataColumns = function (tableName, columnName) {
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
};

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

module.exports.DataColumnsDao = DataColumnsDao;
module.exports.DataColumns = DataColumns;
