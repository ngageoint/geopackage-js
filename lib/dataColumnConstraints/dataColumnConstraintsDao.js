/**
 * DataColumnConstraints module.
 * @module dataColumnConstraints
 */

var Dao = require('../dao/dao')
  , DataColumnConstraints = require('./dataColumnConstraints');

/**
 * Data Column Constraints Data Access Object
 * @class
 * @extends Dao
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 */
class DataColumnConstraintsDao extends Dao {

  /**
   * Creates a new DataColumnConstraints object
   * @return {module:dataColumnConstraints~DataColumnConstraints}
   */
  createObject() {
    return new DataColumnConstraints();
  }
  /**
   * query by constraint name
   * @param  {String} constraintName     constraint name
   * @return {Iterable}
   */
  queryByConstraintName(constraintName) {
    return this.queryForEach(DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME, constraintName);
  }
  /**
   * Query by the unique column values
   * @param  {String} constraintName     constraint name
   * @param  {String} constraintType     constraint type
   * @param  {String} value              value
   * @return {module:dataColumnConstraints~DataColumnConstraints}
   */
  queryUnique(constraintName, constraintType, value) {
    var dataColumnConstraints = new DataColumnConstraints();
    dataColumnConstraints.constraint_name = constraintName;
    dataColumnConstraints.constraint_type = constraintType;
    dataColumnConstraints.value = value;
    return this.queryForSameId(dataColumnConstraints);
  }
}

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

module.exports = DataColumnConstraintsDao;
