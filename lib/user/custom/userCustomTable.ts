/**
 * @module user/custom
 */
import { UserTable } from '../userTable';
import { UserColumn } from '../userColumn';
import { UserCustomColumn } from './userCustomColumn';
import { UserCustomColumns } from './userCustomColumns';

/**
 * Create a new user custom table
 * @class
 * @param  {string} tableName       table name
 * @param  {module:user/userColumn~UserColumn[]} columns         user columns
 * @param  {string[]} requiredColumns required columns
 */
export class UserCustomTable extends UserTable<UserCustomColumn> {
  constructor(tableName: string, columns: UserColumn[], requiredColumns: string[] = []) {
    super(new UserCustomColumns(tableName, columns, requiredColumns, true));
  }

  /**
   * {@inheritDoc}
   */
  copy(): UserCustomTable {
    return new UserCustomTable(this.getTableName(), this.getUserColumns().getColumns(), this.getUserColumns().getRequiredColumns());
  }

  /**
   * {@inheritDoc}
   */
  getDataType(): string {
    return null;
  }

  /**
   * {@inheritDoc}
   */
  getUserColumns(): UserCustomColumns {
    return super.getUserColumns() as UserCustomColumns;
  }

  /**
   * Get the required columns
   *
   * @return required columns
   */
  public getRequiredColumns(): string[] {
    return this.getUserColumns().getRequiredColumns();
  }
}
