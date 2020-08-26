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

  constructor(tableName: string, columns: UserCustomColumn[], requiredColumns: string[], custom: boolean) {
    super(tableName, columns, custom);
    this.requiredColumns = requiredColumns === null || requiredColumns === undefined ? [] : requiredColumns.slice();
    this.updateColumns();
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
  setRequiredColumns(requiredColumns: string[] = []) {
    this.requiredColumns = requiredColumns.slice();
  }

  /**
   * {@inheritDoc}
   */
  updateColumns() {
    super.updateColumns();

    if (!this.isCustom() && this.requiredColumns !== null && this.requiredColumns.length !== 0) {
      let search = new Set<string>(this.requiredColumns);
      let found = {};
      // Find the required columns
      this.getColumns().forEach(column => {
        let columnName = column.getName();
        let columnIndex = column.getIndex();
        if (search.has(columnName)) {
          let previousIndex = found[columnName];
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
