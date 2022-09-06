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
import type { GeoPackageConnection } from '../../db/geoPackageConnection';

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
   * @param db
   * @param table
   */
  constructor(database: string, db: GeoPackageConnection, table: UserCustomTable);

  /**
   * Constructor
   *
   * @param args constructor args
   */
  public constructor(...args) {
    if (args.length === 2) {
      const dao = args[0];
      const userCustomTable = args[1];
      const db = dao.getDb();
      super(dao.getDatabase(), db, new UserCustomConnection(db), userCustomTable);
    } else if (args.length === 3) {
      const database = args[0];
      const db = args[1];
      const table = args[2];
      super(database, db, new UserCustomConnection(db), table);
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
      row.setValueWithColumnName(columnName, results[columnName]);
    }
    return row;
  }

  /**
   * Read the table
   * @param database
   * @param db
   * @param tableName
   */
  static readTable(database: string, db: GeoPackageConnection, tableName: string): UserCustomDao {
    const reader = new UserCustomTableReader(tableName);
    const userCustomTable = reader.readTable(db);
    return new UserCustomDao(database, db, userCustomTable);
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
    throw new Error('Method not implemented.');
  }
}
