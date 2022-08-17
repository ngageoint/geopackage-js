/**
 * DataColumnConstraints module.
 * @module dataColumnConstraints
 */
import { DataColumnConstraints } from './dataColumnConstraints';
import { DBValue } from '../../../db/dbAdapter';
import { GeoPackageDao } from '../../../db/geoPackageDao';
import { DataColumnConstraintsKey } from './dataColumnConstraintsKey';
import { DataColumnsDao } from '../columns/dataColumnsDao';
import { GeoPackageConnection } from '../../../db/geoPackageConnection';

/**
 * Data Column Constraints Data Access Object
 * @class
 * @extends Dao
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 */
export class DataColumnConstraintsDao extends GeoPackageDao<DataColumnConstraints, DataColumnConstraintsKey> {
  private dataColumnsDao: DataColumnsDao = null;
  readonly gpkgTableName: string = DataColumnConstraints.TABLE_NAME;
  readonly idColumns: string[] = [
    DataColumnConstraints.COLUMN_CONSTRAINT_NAME,
    DataColumnConstraints.COLUMN_CONSTRAINT_TYPE,
    DataColumnConstraints.COLUMN_VALUE,
  ];

  /**
   * Create DataColumns Dao from GeoPackageConnection
   * @param geoPackageConnection
   */
  public static createDao(geoPackageConnection: GeoPackageConnection): DataColumnConstraintsDao {
    return new DataColumnConstraintsDao(geoPackageConnection, DataColumnConstraints.TABLE_NAME);
  }

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
      DataColumnConstraints.COLUMN_CONSTRAINT_NAME,
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
    const dataColumnConstraints = new DataColumnConstraintsKey(constraintName, constraintType, value);
    return this.queryForIdWithKey(dataColumnConstraints);
  }

  queryForIdWithKey(key: DataColumnConstraintsKey): DataColumnConstraints {
    return this.queryForMultiId([key.getConstraintName(), key.getConstraintType(), key.getValue()]);
  }

  /**
   * Delete the Data Columns Constraints, cascading
   * @param constraints data column constraints
   * @return deleted count
   */
  public deleteCascade(constraints: DataColumnConstraints): number {
    let count = 0;

    if (constraints != null) {
      // Check if the last remaining constraint with the constraint name
      // is being deleted
      const remainingConstraints = [];
      for (const constraint of this.queryByConstraintName(constraints.getConstraintName())) {
        remainingConstraints.push(constraint);
      }
      if (remainingConstraints.length == 1) {
        const remainingConstraint = remainingConstraints[0];

        // Compare the name, type, and value
        if (
          remainingConstraint.getConstraintName().equals(constraints.getConstraintName()) &&
          remainingConstraint.getConstraintType().equals(constraints.getConstraintType()) &&
          (remainingConstraint.getValue() == null
            ? constraints.getValue() == null
            : remainingConstraint.getValue().equals(constraints.getValue()))
        ) {
          // Delete Data Columns
          const dao = this.getDataColumnsDao();
          for (const dataColumns of dao.queryByConstraintName(constraints.getConstraintName())) {
            dao.delete(dataColumns);
          }
        }
      }

      // Delete
      count = this.delete(constraints);
    }
    return count;
  }

  /**
   * Get or create a Data Columns DAO
   *
   * @return data columns dao
   */
  private getDataColumnsDao(): DataColumnsDao {
    if (this.dataColumnsDao == null) {
      this.dataColumnsDao = DataColumnsDao.createDao(this.db);
    }
    return this.dataColumnsDao;
  }
}
