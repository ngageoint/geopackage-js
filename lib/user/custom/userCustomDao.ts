/**
 * @module user/custom
 */
import { UserDao } from '../userDao';
import { UserCustomTableReader } from './userCustomTableReader';
import { UserCustomTable } from './userCustomTable';
import { UserCustomColumn } from './userCustomColumn';
import { UserCustomRow } from './userCustomRow';
import { UserCustomResultSet } from './userCustomResultSet';
import { BoundingBox } from '../../boundingBox';
import { Projection } from '@ngageoint/projections-js';
import { GeoPackageException } from '../../geoPackageException';
import { UserCustomConnection } from './userCustomConnection';
import { DBValue } from '../../db/dbValue';
import { GeoPackage } from '../../geoPackage';

/**
 * User Custom Dao
 */
export class UserCustomDao extends UserDao<UserCustomColumn, UserCustomTable, UserCustomRow, UserCustomResultSet> {
  /**
   * Constructor
   *
   * @param dao user custom data access object
   * @param userCustomTable user custom table
   */
  public constructor(dao: UserCustomDao, userCustomTable: UserCustomTable);

  /**
   * Constructor
   * @param database
   * @param geoPackage
   * @param table
   */
  constructor(database: string, geoPackage: GeoPackage, table: UserCustomTable);

  /**
   * Constructor
   *
   * @param args constructor args
   */
  public constructor(...args) {
    if (args.length === 2) {
      const dao = args[0] as UserCustomDao;
      const userCustomTable = args[1];
      const geoPackage = dao.getGeoPackage();
      super(dao.getDatabase(), geoPackage, new UserCustomConnection(dao.getDb()), userCustomTable);
    } else if (args.length === 3) {
      const database = args[0];
      const geoPackage = args[1];
      const table = args[2];
      super(database, geoPackage, new UserCustomConnection(geoPackage.getDatabase()), table);
    }
  }

  /**
   * Creates an object from results
   * @param results
   */
  createObject(results: Record<string, DBValue>): UserCustomRow {
    const row = this.newRow();
    const columnNames = this.getTable()
      .getUserColumns()
      .getColumnNames();
    for (const columnName of columnNames) {
      row.setValue(columnName, results[columnName]);
    }
    return row;
  }

  /**
   * Read the table
   * @param database
   * @param geoPackage
   * @param tableName
   */
  static readTable(database: string, geoPackage: GeoPackage, tableName: string): UserCustomDao {
    const reader = new UserCustomTableReader(tableName);
    const userCustomTable = reader.readTable(geoPackage.getConnection());
    return new UserCustomDao(database, geoPackage, userCustomTable);
  }

  protected getBoundingBox(): BoundingBox {
    throw new GeoPackageException('Bounding Box not supported for User Custom');
  }

  protected getBoundingBoxInProjection(projection: Projection): BoundingBox {
    throw new GeoPackageException('Bounding Box not supported for User Custom');
  }

  newRow(): UserCustomRow {
    return new UserCustomRow(this.getTable());
  }

  /**
   * Get the count of the result set and close it
   * @param resultSet result set
   * @return count
   */
  public countOfResultSet(resultSet: UserCustomResultSet): number {
    return resultSet != null ? resultSet.getCount() : 0;
  }

  protected getBoundingBoxWithProjection(projection: Projection): BoundingBox {
    throw new GeoPackageException('Method not implemented.');
  }
}
