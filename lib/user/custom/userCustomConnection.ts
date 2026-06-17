import { UserConnection } from '../userConnection';
import { UserCustomColumn } from './userCustomColumn';
import { UserCustomTable } from './userCustomTable';
import { UserCustomRow } from './userCustomRow';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { UserCustomResultSet } from './userCustomResultSet';
import { ResultSet } from '../../db/resultSet';

/**
 * GeoPackage User Custom Connection
 */
export class UserCustomConnection extends UserConnection<
  UserCustomColumn,
  UserCustomTable,
  UserCustomRow,
  UserCustomResultSet
> {
  /**
   * Constructor
   * @param database database connection
   */
  public constructor(database: GeoPackageConnection) {
    super(database);
  }

  /**
   * Create the UserCustomResultSet
   * @param columns
   * @param resultSet
   * @param sql
   * @param selectionArgs
   * @protected
   */
  protected createResult(
    columns: string[],
    resultSet: ResultSet,
    sql: string,
    selectionArgs: string[],
  ): UserCustomResultSet {
    return new UserCustomResultSet(this.getTable(), columns, resultSet, sql, selectionArgs);
  }
}
