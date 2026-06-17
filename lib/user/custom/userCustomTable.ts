import { UserTable } from '../userTable';
import { UserCustomColumn } from './userCustomColumn';
import { UserCustomColumns } from './userCustomColumns';
import { UserColumns } from '../userColumns';

/**
 * Create a new user custom table
 * @class
 * @param  {string} tableName       table name
 * @param  {UserColumn[]} columns         user columns
 * @param  {string[]} requiredColumns required columns
 */
export class UserCustomTable extends UserTable<UserCustomColumn> {
  /**
   * Constructor
   * @param tableName table name
   * @param columns list of columns
   */
  public constructor(tableName: string, columns: UserCustomTable[]);

  /**
   * Constructor
   * @param tableName table name
   * @param columns list of columns
   * @param requiredColumns list of required columns
   */
  public constructor(tableName: string, columns: UserCustomColumn[], requiredColumns: string[]);

  /**
   * Constructor
   * @param columns columns
   */
  public constructor(columns: UserCustomColumns);

  /**
   * Copy Constructor
   * @param userCustomTable  user custom table
   */
  public constructor(userCustomTable: UserCustomTable);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof UserCustomColumns) {
        super(args[0]);
      } else if (args[0] instanceof UserCustomTable) {
        super(args[0]);
      }
    } else if (args.length === 2) {
      const tableName = args[0];
      const columns = args[1];
      super(new UserCustomColumns(tableName, columns, null));
    } else if (args.length === 3) {
      const tableName = args[0];
      const columns = args[1];
      const requiredColumns = args[2];
      super(new UserCustomColumns(tableName, columns, requiredColumns));
    }
  }

  /**
   * Create user columns
   * @param columns
   */
  public createUserColumns(columns: UserCustomColumn[]): UserColumns<UserCustomColumn> {
    return new UserCustomColumns(this.getTableName(), columns, this.getRequiredColumns(), true);
  }

  /**
   * Copy the UserCustomTable
   * @return {UserCustomTable}
   */
  copy(): UserCustomTable {
    const tableCopy = new UserCustomTable(
      this.getTableName(),
      this.getUserColumns().getColumns(),
      this.getUserColumns().getRequiredColumns(),
    );
    tableCopy.setContents(this.getContents());
    tableCopy.addConstraintsWithConstraints(this.getConstraints().copy());
    return tableCopy;
  }

  /**
   * Get the data type
   * @return {string}
   */
  getDataType(): string {
    return null;
  }

  /**
   * Get user columns
   * @return {UserCustomColumns}
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
