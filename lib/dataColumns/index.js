/**
 * DataColumns module.
 * @module dataColumns
 * @see module:dao/dao
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
  this.tableName;

  /**
   * the name of the table column
   * @member {string}
   */
  this.columnName;

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
  this.theDescription;

  /**
   * MIME type of columnName if BLOB type or NULL for other types
   * @member {string}
   */
  this.mimeType;

  /**
   * Case sensitive column value constraint name specified
   */
  this.constraintName;
}

/**
 * Set the contents
 * @param {Contents} contents the contents
 */
DataColumns.prototype.setContents = function (contents) {

};

/**
 * set the DataColumnConstraints
 * @param {DataColumnConstraints} constraint constraints
 */
DataColumns.prototype.setConstraint = function (constraint) {

};

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class
 * @extends {module:dao/dao~Dao}
 */
var DataColumnsDao = function(connection) {
  Dao.call(this, connection);
  this.initializeColumnIndex();
}

util.inherits(DataColumnsDao, Dao);

/**
 * Get the Contents from the Data Columns
 * @param  {DataColumns} dataColumns data columns
 * @return {Contents}             contents
 */
DataColumnsDao.prototype.getContents = function (dataColumns, callback) {
  var cd = new ContentsDao(this.connection);
  cd.queryForIdObject(dataColumns.tableName, callback);
};

/**
 * query by constraint name
 * @param  {String} constraintName     constraint name
 * @param  {Function} dataColumnCallback callback for each result
 * @param  {Function} doneCallback       callback for done
 */
DataColumnsDao.prototype.queryByConstraintName = function (constraintName, dataColumnCallback, doneCallback) {
  this.queryForEqWithFieldAndValue(DataColumnsDao.COLUMN_CONSTRAINT_NAME, constraintName, dataColumnCallback, doneCallback);
};

/**
 * Get DataColumn by column name and table name
 * @param  {String} tableName  table name
 * @param  {String} columnName column name
 * @param  {Function} callback callback with data column
 */
DataColumnsDao.prototype.getDataColumns = function (tableName, columnName, callback) {
  this.isTableExists(function(err, results) {
    if (err || !results) {
      return callback();
    }
    var where = this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_TABLE_NAME, tableName) +
      ' and ' +
      this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_COLUMN_NAME, columnName);
    var values = [tableName, columnName];
    var dataColumn;
    this.queryWhereWithArgs(where, values, function(err, row, rowDone) {
      if (!dataColumn) {
        dataColumn = row;
      }
      rowDone();
    }, function(err) {
      callback(err, dataColumn);
    })
  }.bind(this));
};

DataColumns.TABLE_NAME = "tableName";
DataColumns.COLUMN_NAME = "columnName";
DataColumns.NAME = "name";
DataColumns.TITLE = "title";
DataColumns.DESCRIPTION = "theDescription";
DataColumns.MIME_TYPE = "mimeType";
DataColumns.CONSTRAINT_NAME = "constraintName";

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

DataColumnsDao.prototype.tableName = DataColumnsDao.TABLE_NAME;
DataColumnsDao.prototype.idColumns = [DataColumnsDao.COLUMN_PK1, DataColumnsDao.COLUMN_PK2];
DataColumnsDao.prototype.columns = [DataColumnsDao.COLUMN_TABLE_NAME, DataColumnsDao.COLUMN_COLUMN_NAME, DataColumnsDao.COLUMN_NAME, DataColumnsDao.COLUMN_NAME, DataColumnsDao.COLUMN_TITLE, DataColumnsDao.COLUMN_DESCRIPTION, DataColumnsDao.COLUMN_MIME_TYPE, DataColumnsDao.COLUMN_CONSTRAINT_NAME];

DataColumnsDao.prototype.columnToPropertyMap = {};
DataColumnsDao.prototype.columnToPropertyMap[DataColumnsDao.COLUMN_TABLE_NAME] = DataColumns.TABLE_NAME;
DataColumnsDao.prototype.columnToPropertyMap[DataColumnsDao.COLUMN_COLUMN_NAME] = DataColumns.TABLE_NAME;
DataColumnsDao.prototype.columnToPropertyMap[DataColumnsDao.COLUMN_NAME] = DataColumns.TABLE_NAME;
DataColumnsDao.prototype.columnToPropertyMap[DataColumnsDao.COLUMN_TITLE] = DataColumns.TABLE_NAME;
DataColumnsDao.prototype.columnToPropertyMap[DataColumnsDao.COLUMN_DESCRIPTION] = DataColumns.TABLE_NAME;
DataColumnsDao.prototype.columnToPropertyMap[DataColumnsDao.COLUMN_MIME_TYPE] = DataColumns.TABLE_NAME;
DataColumnsDao.prototype.columnToPropertyMap[DataColumnsDao.COLUMN_CONSTRAINT_NAME] = DataColumns.TABLE_NAME;

module.exports.DataColumnsDao = DataColumnsDao;
module.exports.DataColumns = DataColumns;
