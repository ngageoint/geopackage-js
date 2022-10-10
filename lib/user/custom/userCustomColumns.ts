/**
 * @module user/custom
 */
import { UserCustomColumn } from './userCustomColumn';
import { UserColumns } from '../userColumns';

/**
 * UserCustomColumns
 */
export class UserCustomColumns extends UserColumns<UserCustomColumn> {
  /**
   * Required columns
   */
  requiredColumns: string[];

  /**
   * Constructor
   * @param tableName table name
   * @param columns columns
   */
  public constructor(tableName: string, columns: UserCustomColumn[]);

  /**
   * Constructor
   * @param tableName table name
   * @param columns columns
   * @param requiredColumns list of required columns
   */
  public constructor(tableName: string, columns: UserCustomColumn[], requiredColumns: string[]);

  /**
   * Constructor
   * @param tableName table name
   * @param columns columns
   * @param custom custom column specification
   */
  public constructor(tableName: string, columns: UserCustomColumn[], custom: boolean);

  /**
   * Constructor
   * @param tableName table name
   * @param columns columns
   * @param requiredColumns list of required columns
   * @param custom custom column specification
   */
  public constructor(
    tableName: string,
    columns: UserCustomColumn[],
    requiredColumns?: string[],
    custom?: boolean,
  );

  /**
   * Copy Constructor
   * @param userCustomColumns user custom columns
   */
  public constructor(userCustomColumns: UserCustomColumns);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof UserCustomColumns) {
      const userCustomColumns = args[0];
      super(userCustomColumns);
      if (userCustomColumns.requiredColumns != null) {
        this.requiredColumns = userCustomColumns.requiredColumns.slice();
      }
    } else if (args.length === 2) {
      const tableName = args[0];
      const columns = args[1];
      super(tableName, columns, false);
      this.requiredColumns = null;
      this.updateColumns();
    } else if (args.length === 3) {
      const tableName = args[0];
      const columns = args[1];
      const custom = args[2] != null && typeof args[2] === 'boolean' ? args[2] : false;
      const requiredColumns = args[2] != null && args[2].length != null ? args[2] : null;
      super(tableName, columns, custom);
      this.requiredColumns = requiredColumns;
      this.updateColumns();
    } else if (args.length === 4) {
      const tableName = args[0];
      const columns = args[1];
      const requiredColumns = args[2];
      const custom = args[3];
      super(tableName, columns, custom);
      this.requiredColumns = requiredColumns;
      this.updateColumns();
    }
  }

  copy(): UserCustomColumns {
    return new UserCustomColumns(this.getTableName(), this.getColumns(), this.getRequiredColumns(), this.isCustom());
  }

  /**
   * Get the required columns
   * @return required columns
   */
  getRequiredColumns(): string[] {
    return this.requiredColumns;
  }

  /**
   * Set the required columns
   * @param requiredColumns required columns
   */
  setRequiredColumns(requiredColumns: string[] = []): void {
    this.requiredColumns = requiredColumns.slice();
  }

  /**
   * {@inheritDoc}
   */
  updateColumns(): void {
    super.updateColumns();
    if (!this.isCustom() && this.requiredColumns !== null && this.requiredColumns.length !== 0) {
      const search = new Set<string>(this.requiredColumns);
      const found = {};
      // Find the required columns
      this.getColumns().forEach(column => {
        const columnName = column.getName();
        const columnIndex = column.getIndex();
        if (search.has(columnName)) {
          const previousIndex = found[columnName];
          this.duplicateCheck(columnIndex, previousIndex, columnName);
          found[columnName] = columnIndex;
        }
      });

      // Verify the required columns were found
      search.forEach(requiredColumn => {
        this.missingCheck(found[requiredColumn], requiredColumn);
      });
    }
  }
}
