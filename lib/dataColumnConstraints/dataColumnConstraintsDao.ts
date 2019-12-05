import Dao from '../dao/dao';

/**
 * DataColumnConstraints module.
 * @module dataColumnConstraints
 */

var DataColumnConstraints = require('./dataColumnConstraints');

/**
 * Data Column Constraints Data Access Object
 * @class
 * @extends Dao
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 */
export default class DataColumnConstraintsDao extends Dao<typeof DataColumnConstraints> {
  public static readonly TABLE_NAME = "gpkg_data_column_constraints";
  public static readonly COLUMN_CONSTRAINT_NAME = "constraint_name";
  public static readonly COLUMN_CONSTRAINT_TYPE = "constraint_type";
  public static readonly COLUMN_VALUE = "value";
  public static readonly COLUMN_MIN = "min";
  public static readonly COLUMN_MIN_IS_INCLUSIVE = "min_is_inclusive";
  public static readonly COLUMN_MAX = "max";
  public static readonly COLUMN_MAX_IS_INCLUSIVE = "max_is_inclusive";
  public static readonly COLUMN_DESCRIPTION = "description";
  
  public static readonly ENUM_TYPE = 'enum';
  public static readonly GLOB_TYPE = 'glob';
  public static readonly RANGE_TYPE = 'range';
  
  readonly gpkgTableName = DataColumnConstraintsDao.TABLE_NAME;
  readonly idColumns = [DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME, DataColumnConstraintsDao.COLUMN_CONSTRAINT_TYPE, DataColumnConstraintsDao.COLUMN_VALUE];
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
