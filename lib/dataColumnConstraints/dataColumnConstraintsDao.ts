import { Dao } from '../dao/dao';
import { DataColumnConstraints } from './dataColumnConstraints';
import { DBValue } from '../db/dbAdapter';

/**
 * DataColumnConstraints module.
 * @module dataColumnConstraints
 */

/**
 * Data Column Constraints Data Access Object
 * @class
 * @extends Dao
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 */
export class DataColumnConstraintsDao extends Dao<DataColumnConstraints> {
  public static readonly TABLE_NAME: string = 'gpkg_data_column_constraints';
  public static readonly COLUMN_CONSTRAINT_NAME: string = 'constraint_name';
  public static readonly COLUMN_CONSTRAINT_TYPE: string = 'constraint_type';
  public static readonly COLUMN_VALUE: string = 'value';
  public static readonly COLUMN_MIN: string = 'min';
  public static readonly COLUMN_MIN_IS_INCLUSIVE: string = 'min_is_inclusive';
  public static readonly COLUMN_MAX: string = 'max';
  public static readonly COLUMN_MAX_IS_INCLUSIVE: string = 'max_is_inclusive';
  public static readonly COLUMN_DESCRIPTION: string = 'description';

  public static readonly ENUM_TYPE: string = 'enum';
  public static readonly GLOB_TYPE: string = 'glob';
  public static readonly RANGE_TYPE: string = 'range';

  readonly gpkgTableName: string = DataColumnConstraintsDao.TABLE_NAME;
  readonly idColumns: string[] = [
    DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME,
    DataColumnConstraintsDao.COLUMN_CONSTRAINT_TYPE,
    DataColumnConstraintsDao.COLUMN_VALUE,
  ];
  /**
   * Creates a new DataColumnConstraints object
   * @return {module:dataColumnConstraints~DataColumnConstraints}
   */
  createObject(results?: Record<string, DBValue>): DataColumnConstraints {
    const dcc = new DataColumnConstraints();
    if (results) {
      dcc.constraint_name = results.constraint_name as string;
      dcc.constraint_type = results.constraint_type as string;
      dcc.value = results.value as string;
      dcc.min = results.min as number;
      dcc.max = results.max as number;
      dcc.min_is_inclusive = results.min_is_inclusive as boolean;
      dcc.max_is_inclusive = results.max_is_inclusive as boolean;
      dcc.description = results.description as string;
    }
    return dcc;
  }
  /**
   * query by constraint name
   * @param  {String} constraintName     constraint name
   * @return {Iterable}
   */
  queryByConstraintName(constraintName: string): IterableIterator<DataColumnConstraints> {
    return (this.queryForEach(
      DataColumnConstraintsDao.COLUMN_CONSTRAINT_NAME,
      constraintName,
    ) as unknown) as IterableIterator<DataColumnConstraints>;
  }
  /**
   * Query by the unique column values
   * @param  {String} constraintName     constraint name
   * @param  {String} constraintType     constraint type
   * @param  {String} value              value
   * @return {module:dataColumnConstraints~DataColumnConstraints}
   */
  queryUnique(constraintName: string, constraintType: string, value: string): DataColumnConstraints {
    const dataColumnConstraints = new DataColumnConstraints();
    dataColumnConstraints.constraint_name = constraintName;
    dataColumnConstraints.constraint_type = constraintType;
    dataColumnConstraints.value = value;
    return this.queryForSameId(dataColumnConstraints);
  }
}
