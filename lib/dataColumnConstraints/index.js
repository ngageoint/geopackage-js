/**
 * DataColumnConstraints module.
 * @module dataColumnConstraints
 * @see module:dao/dao
 */

var Dao = require('../dao/dao');

var util = require('util');

/**
 * Contains data to specify restrictions on basic data type column values
 * @class DataColumnConstraints
 */
var DataColumnConstraints = function() {

  /**
   * Case sensitive name of constraint
   * @member {string}
   */
  this.constraint_name;

  /**
   * Lowercase type name of constraint: range | enum | glob
   * @member {string}
   */
  this.constraint_type;

  /**
   * Specified case sensitive value for enum or glob or NULL for range constraint_type
   * @member {string}
   */
  this.value;

  /**
   * Minimum value for 'range' or NULL for 'enum' or 'glob' constraint_type
   * @member {Number}
   */
  this.min;

  /**
   * 0 (false) if min value is exclusive, or 1 (true) if min value is inclusive
   * @member {Number}
   */
  this.min_is_inclusive;

  /**
   * Maximum value for 'range' or NULL for 'enum' or 'glob' constraint_type
   * @member {Number}
   */
  this.max;

  /**
   * 0 (false) if max value is exclusive, or 1 (true) if max value is inclusive
   * @member {Number}
   */
  this.max_is_inclusive;

  /**
   * For ranges and globs, describes the constraing; for enums, describes the enum value.
   */
  this.description;

}

/**
 * Data Column Constraints Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
var DataColumnConstraintsDao = function(geoPackage) {
  Dao.call(this, geoPackage);
}

util.inherits(DataColumnConstraintsDao, Dao);

DataColumnConstraintsDao.prototype.createObject = function () {
  return new DataColumnConstraints();
};

/**
 * query by constraint name
 * @param  {String} constraintName     constraint name
 * @param  {Function} dataColumnConstraintCallback callback for each result
 * @param  {Function} doneCallback       callback for done
 */
DataColumnConstraintsDao.prototype.queryByConstraintName = function (constraintName) {
  return this.queryForEachEqWithFieldAndValue(DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME, constraintName);
};

/**
 * Query by the unique column values
 * @param  {String} constraintName     constraint name
 * @param  {String} constraintType     constraint type
 * @param  {String} value              value
 */
DataColumnConstraintsDao.prototype.queryUnique = function (constraintName, constraintType, value) {
  var dataColumnConstraints = new DataColumnConstraints();
  dataColumnConstraints.constraint_name = constraintName;
  dataColumnConstraints.constraint_type = constraintType;
  dataColumnConstraints.value = value;

  return this.queryForSameId(dataColumnConstraints);
};

DataColumnConstraintsDao.TABLE_NAME = "gpkg_data_column_constraints";
DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME = "constraint_name";
DataColumnConstraintsDao.COLUMN_CONSTRAINT_TYPE = "constraint_type";
DataColumnConstraintsDao.COLUMN_VALUE = "value";
DataColumnConstraintsDao.COLUMN_MIN = "min";
DataColumnConstraintsDao.COLUMN_MIN_IS_INCLUSIVE = "min_is_inclusive";
DataColumnConstraintsDao.COLUMN_MAX = "max";
DataColumnConstraintsDao.COLUMN_MAX_IS_INCLUSIVE = "max_is_inclusive";
DataColumnConstraintsDao.COLUMN_DESCRIPTION = "description";

DataColumnConstraintsDao.ENUM_TYPE = 'enum';
DataColumnConstraintsDao.GLOB_TYPE = 'glob';
DataColumnConstraintsDao.RANGE_TYPE = 'range';

DataColumnConstraintsDao.prototype.gpkgTableName = DataColumnConstraintsDao.TABLE_NAME;
DataColumnConstraintsDao.prototype.idColumns = [DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME, DataColumnConstraintsDao.COLUMN_CONSTRAINT_TYPE, DataColumnConstraintsDao.COLUMN_VALUE];

module.exports.DataColumnConstraintsDao = DataColumnConstraintsDao;
module.exports.DataColumnConstraints = DataColumnConstraints;
