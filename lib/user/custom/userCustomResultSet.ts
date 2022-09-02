import { UserResultSet } from '../userResultSet';
import { UserCustomColumn } from './userCustomColumn';
import { UserCustomTable } from './userCustomTable';
import { UserCustomRow } from './userCustomRow';
import { UserColumns } from '../userColumns';
import { ResultSet } from '../../db/resultSet';
import { UserCustomColumns } from './userCustomColumns';
import { DBValue } from '../../db/dbValue';

/**
 * User Custom Result Set to wrap a database ResultSet for tile queries
 */
export class UserCustomResultSet extends UserResultSet<UserCustomColumn, UserCustomTable, UserCustomRow> {
  /**
   * Constructor
   *
   * @param table user custom table
   * @param columns columns
   * @param resultSet result set
   * @param sql SQL statement
   * @param selectionArgs selection arguments
   */
  public constructor(
    table: UserCustomTable,
    columns: string[] | UserColumns<UserCustomColumn>,
    resultSet: ResultSet,
    sql: string,
    selectionArgs: any[],
  ) {
    super(table, columns, resultSet, sql, selectionArgs);
  }

  /**
   * Get row with column types and values
   * @param columnTypes
   * @param values
   */
  public getRowWithColumnTypesAndValues(columnTypes: number[], values: DBValue[]): UserCustomRow {
    return new UserCustomRow(this.getTable(), this.getColumns(), columnTypes, values);
  }

  /**
   * {@inheritDoc}
   */
  public getColumns(): UserCustomColumns {
    return super.getColumns() as UserCustomColumns;
  }
}
