/**
 * Abstract collection of columns from a user table, representing a full set of
 * table columns or a subset from a query
 * @param <TColumn> column type
 */
import { UserColumn } from './userColumn';
import { GeoPackageDataType } from '../db/geoPackageDataType';

export class UserColumns<TColumn extends UserColumn> {

  /**
   * Table name, null when a pre-ordered subset of columns for a query
   */
  _tableName: string;

  /**
   * Array of column names
   */
  _columnNames: string[];

  /**
   * List of columns
   */
  _columns: TColumn[];

  /**
   * Custom column specification flag (subset of table columns or different
   * ordering)
   */
  _custom: boolean;

  /**
   * Mapping between (lower cased) column names and their index
   */
  _nameToIndex: Map<string, number>;

  /**
   * Primary key column index
   */
  _pkIndex: number = -1;

  /**
   * Constructor
   * @param tableName table name
   * @param columns columns
   * @param custom custom column specification
   */
  protected constructor(tableName: string, columns: TColumn[], custom: boolean = false) {
    this._tableName = tableName;
    this._columns = columns;
    this._custom = custom;
    this._nameToIndex = new Map<string, number>();
    this._columnNames = [];
  }

  // /**
  //  * Copy Constructor
  //  *
  //  * @param userColumns
  //  *            user columns
  //  */
  // protected UserColumns(UserColumns<TColumn> userColumns) {
  //   this.tableName = userColumns.tableName;
  //   this.columnNames = new String[userColumns.columnNames.length];
  //   System.arraycopy(userColumns.columnNames, 0, this.columnNames, 0,
  //     this.columnNames.length);
  //   this.columns = new ArrayList<>();
  //   for (TColumn column : userColumns.columns) {
  //   @SuppressWarnings("unchecked")
  //     TColumn copiedColumn = (TColumn) column.copy();
  //     this.columns.add(copiedColumn);
  //   }
  //   this.nameToIndex = new HashMap<String, Integer>();
  //   this.nameToIndex.putAll(userColumns.nameToIndex);
  //   this.pkIndex = userColumns.pkIndex;
  // }

  /**
   * Copy the user columns
   * @return copied user columns
   */
  copy(): UserColumns<TColumn> {
    const columns = [];
    this._columns.forEach(column => {
      columns.push(column.copy());
    });
    const copy = new UserColumns<TColumn>(this._tableName, columns, this._custom);
    copy._columnNames = Array.from(this._columnNames);
    copy._nameToIndex = new Map<string, number>(this._nameToIndex);
    copy._pkIndex = this._pkIndex;
    return copy;
  }

  /**
   * Update the table columns
   */
  updateColumns() {
    this._nameToIndex.clear();
    if (!this._custom) {
      const indices = new Set<number>();

      // Check for missing indices and duplicates
      let needsIndex = [];
      this._columns.forEach(column => {
        if (column.hasIndex()) {
          const index = column.getIndex();
          if (indices.has(index)) {
            throw new Error("Duplicate index: " + index + ", Table Name: " + this._tableName);
          } else {
            indices.add(index);
          }
        } else {
          needsIndex.push(column);
        }
      });

      // Update columns that need an index
      let currentIndex = -1;
      needsIndex.forEach(column => {
        while (indices.has(++currentIndex)) {
        }
        column.setIndex(currentIndex);
      });

      // Sort the columns by index
      this._columns.sort((a, b) => {
        return a.index - b.index;
      });
    }

    this._pkIndex = -1;
    this._columnNames = [];

    for (let index = 0; index < this._columns.length; index++) {
      const column = this._columns[index];
      const columnName = column.getName();
      const lowerCaseColumnName = columnName.toLowerCase();

      if (!this._custom) {
        if (column.getIndex() != index) {
          throw new Error("No column found at index: "
            + index + ", Table Name: " + this._tableName);
        }

        if (this._nameToIndex.has(lowerCaseColumnName)) {
          throw new Error(
            'Duplicate column found at index: ' + index
            + ', Table Name: ' + this._tableName + ', Name: '
            + columnName);
        }
      }

      if (column.isPrimaryKey()) {
        if (this._pkIndex != -1) {
          let error = 'More than one primary key column was found for ';
          if (this._custom) {
            error = error.concat('custom specified table columns');
          } else {
            error = error.concat('table');
          }
         error = error.concat('. table: ' + this._tableName + ', index1: '
            + this._pkIndex + ', index2: ' + index);
          if (this._custom) {
            error = error.concat(', columns: ' + this._columnNames);
          }
          throw new Error(error);
        }
        this._pkIndex = index;
      }

      this._columnNames[index] = columnName;
      this._nameToIndex.set(lowerCaseColumnName, index);
    }
  }

  /**
   * Check for duplicate column names
   *
   * @param index index
   * @param previousIndex previous index
   * @param column column
   */
  duplicateCheck(index: number, previousIndex: number, column: string) {
    if (previousIndex !== null || previousIndex !== undefined) {
      throw new Error('More than one ' + column + ' column was found for table \'' + this._tableName + '\'. Index ' + previousIndex + ' and ' + index);
    }
  }

  /**
   * Check for the expected data type
   * @param expected expected data type
   * @param column user column
   */
  typeCheck(expected: GeoPackageDataType, column: TColumn) {
    const actual = column.getDataType();
    if (actual === null || actual === undefined || actual !== expected) {
      throw new Error('Unexpected ' + column.getName()
        + ' column data type was found for table \'' + this._tableName
        + '\', expected: ' + GeoPackageDataType.nameFromType(expected) + ', actual: '
        + (actual !== null && actual !== undefined ? GeoPackageDataType.nameFromType(actual) : 'null'));
    }
  }

  /**
   * Check for missing columns
   * @param index column index
   * @param column user column
   */
  missingCheck(index: number, column: string) {
    if (index === null || index === undefined) {
      throw new Error('No ' + column + ' column was found for table \'' + this._tableName + '\'');
    }
  }

  /**
   * Get the column index of the column name
   * @param columnName column name
   * @return column index
   */
  getColumnIndexForColumnName(columnName: string): number {
    return this.getColumnIndex(columnName, true);
  }

  /**
   * Get the column index of the column name
   * @param columnName column name
   * @param required column existence is required
   * @return column index
   */
  getColumnIndex(columnName: string, required: boolean): number {
    let index = this._nameToIndex.get(columnName.toLowerCase());
    if (required && (index === null  || index === undefined)) {
      let error = 'Column does not exist in ';
      if (this._custom) {
        error = error.concat('custom specified table columns');
      } else {
        error = error.concat('table');
      }
      error = error.concat('. table: ' + this._tableName + ', column: ' + columnName);
      if (this._custom) {
        error = error.concat(', columns: ' + this._columnNames);
      }
      throw new Error(error);
    }
    return index;
  }

  /**
   * Get the array of column names
   * @return column names
   */
  getColumnNames(): string[] {
    return this._columnNames;
  }

  /**
   * Get the column name at the index
   * @param index column index
   * @return column name
   */
  getColumnName(index: number): string {
    return this._columnNames[index];
  }

  /**
   * Get the list of columns
   * @return columns
   */
  getColumns(): TColumn[] {
    return this._columns;
  }

  /**
   * Get the column at the index
   * @param index column index
   * @return column
   */
  getColumnForIndex(index: number): TColumn {
    return this._columns[index];
  }

  /**
   * Get the column of the column name
   * @param columnName column name
   * @return column
   */
  getColumn(columnName: string): TColumn {
    return this.getColumnForIndex(this.getColumnIndexForColumnName(columnName));
  }

  /**
   * Check if the table has the column
   * @param columnName column name
   * @return true if has the column
   */
  hasColumn(columnName: string): boolean {
    return this._nameToIndex.has(columnName.toLowerCase());
  }

  /**
   * Get the column count
   * @return column count
   */
  columnCount(): number {
    return this._columns.length;
  }

  /**
   * Get the table name
   * @return table name
   */
  getTableName(): string {
    return this._tableName;
  }

  /**
   * Set the table name
   * @param tableName table name
   */
  setTableName(tableName: string) {
    this._tableName = tableName;
  }

  /**
   * Is custom column specification (partial and/or ordering)
   * @return custom flag
   */
  isCustom(): boolean {
    return this._custom;
  }

  /**
   * Set the custom column specification flag
   * @param custom custom flag
   */
  setCustom(custom: boolean) {
    this._custom = custom;
  }

  /**
   * Check if the table has a primary key column
   * @return true if has a primary key
   */
  hasPkColumn(): boolean {
    return this._pkIndex >= 0;
  }

  /**
   * Get the primary key column index
   * @return primary key column index
   */
  getPkColumnIndex(): number {
    return this._pkIndex;
  }

  /**
   * Get the primary key column
   * @return primary key column
   */
  getPkColumn(): TColumn {
    let column = null;
    if (this.hasPkColumn()) {
      column = this._columns[this._pkIndex];
    }
    return column;
  }

  /**
   * Get the primary key column name
   * @return primary key column name
   */
  getPkColumnName(): string {
    return this.getPkColumn().getName();
  }

  /**
   * Get the columns with the provided data type
   * @param type data type
   * @return columns
   */
  columnsOfType(type: GeoPackageDataType): TColumn[] {
    return this._columns.filter(column => column.getDataType() === type);
  }

  /**
   * Add a new column
   * @param column new column
   */
  addColumn(column: TColumn) {
    this._columns.push(column);
    this.updateColumns();
  }

  /**
   * Rename a column
   * @param column column
   * @param newColumnName new column name
   */
  renameColumn(column: TColumn, newColumnName: string) {
    this.renameColumnWithName(column.getName(), newColumnName);
    column.setName(newColumnName);
  }

  /**
   * Rename a column
   * @param columnName column name
   * @param newColumnName new column name
   */
  renameColumnWithName(columnName: string, newColumnName: string) {
    this.renameColumnWithIndex(this.getColumnIndexForColumnName(columnName), newColumnName);
  }

  /**
   * Rename a column
   * @param index column index
   * @param newColumnName new column name
   */
  renameColumnWithIndex(index: number, newColumnName: string) {
    this._columns[index].setName(newColumnName);
    this.updateColumns();
  }

  /**
   * Drop a column
   * @param column column to drop
   */
  dropColumn(column: TColumn) {
    this.dropColumnWithIndex(column.getIndex());
  }

  /**
   * Drop a column
   * @param columnName column name
   */
  dropColumnWithName(columnName: string) {
    this.dropColumnWithIndex(this.getColumnIndexForColumnName(columnName));
  }

  /**
   * Drop a column
   * @param index column index
   */
  dropColumnWithIndex(index: number) {
    this._columns = this._columns.splice(index, 1);
    this._columns.forEach(column => column.resetIndex());
    this.updateColumns();
  }

  /**
   * Alter a column
   * @param column altered column
   */
  alterColumn(column: TColumn) {
    let existingColumn = this.getColumn(column.getName());
    column.setIndex(existingColumn.getIndex());
    this._columns[column.getIndex()] = column;
  }

}
