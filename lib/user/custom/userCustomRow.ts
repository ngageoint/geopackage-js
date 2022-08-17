import { UserRow } from '../userRow';
import { UserCustomColumn } from './userCustomColumn';
import { UserCustomTable } from './userCustomTable';
import { UserCustomColumns } from './userCustomColumns';
import { DBValue } from '../../db/dbAdapter';

/**
 * User Custom Row containing the values from a single result set row
 */
export class UserCustomRow extends UserRow<UserCustomColumn, UserCustomTable> {
  /**
   * Constructor to create an empty row
   *
   * @param table
   *            user custom table
   */
  constructor(table: UserCustomTable);

  /**
   * Copy Constructor
   *
   * @param userCustomRow user custom row to copy
   */
  constructor(userCustomRow: UserCustomRow);

  /**
   * Constructor
   *
   * @param table user custom table
   * @param columns columns
   * @param columnTypes column types
   * @param values values
   */
  constructor(table: UserCustomTable, columns: UserCustomColumns, columnTypes: number[], values: DBValue[]);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof UserCustomTable) {
        super(args[0]);
      } else if (args[0] instanceof UserCustomRow) {
        super(args[0]);
      }
    } else if (args.length === 4) {
      super(args[0], args[1], args[2], args[3]);
    }
  }

  /**
   * {@inheritDoc}
   */
  public getColumns(): UserCustomColumns {
    return super.getColumns() as UserCustomColumns;
  }

  /**
   * Copy the row
   *
   * @return row copy
   */
  public copy(): UserCustomRow {
    return new UserCustomRow(this);
  }
}
