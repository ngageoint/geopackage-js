/**
 * Abstract collection of columns from a user table, representing a full set of
 * table columns or a subset from a query
 * @param <TColumn> column type
 */
import { UserColumn } from './userColumn';
import { GeoPackageDataType } from '../db/geoPackageDataType';
import { GeoPackageException } from '../geoPackageException';

export abstract class UserColumns<TColumn extends UserColumn> {
  /**
   * Table name, null when a pre-ordered subset of columns for a query
   */
  private tableName: string;

  /**
   * Array of column names
   */
  private columnNames: string[];

  /**
   * List of columns
   */
  private readonly columns: TColumn[];

  /**
   * Custom column specification flag (subset of table columns or different
   * ordering)
   */
  private custom: boolean;

  /**
   * Mapping between (lower cased) column names and their index
   */
  private readonly nameToIndex: Map<string, number>;

  /**
   * Primary key column index
   */
  private pkIndex: number;

  /**
   * Indicates if the primary key is modifiable
   */
  private pkModifiable = false;

  /**
   * Indicates if values are validated against column types
   */
  private valueValidation = true;

  /**
   * Constructor
   * @param tableName table name
   * @param columns columns
   * @param custom custom column specification
   */
  protected constructor(tableName: string, columns: TColumn[], custom: boolean);

  /**
   * Copy Constructor
   *
   * @param userColumns
   *            user columns
   */
  protected constructor(userColumns: UserColumns<TColumn>);

  /**
   * Constructor
   * @param args
   * @protected
   */
  protected constructor(...args) {
    if (args.length === 1) {
      const userColumns = args[0];
      this.tableName = userColumns.tableName;
      this.columnNames = userColumns.columnNames.slice();
      this.columns = [];
      for (const column of userColumns.columns) {
        const copiedColumn = column.copy() as TColumn;
        this.columns.push(copiedColumn);
      }
      this.nameToIndex = new Map<string, number>(userColumns.nameToIndex);
      this.pkIndex = userColumns.pkIndex;
      this.pkModifiable = userColumns.pkModifiable;
      this.valueValidation = userColumns.valueValidation;
    } else if (args.length === 3) {
      this.tableName = args[0];
      this.columns = args[1];
      this.custom = args[2];
      this.nameToIndex = new Map<string, number>();
    }
  }

  /**
   * Copy the user columns
   *
   * @return copied user columns
   */
  public abstract copy(): UserColumns<TColumn>;

  /**
   * Update the table columns
   */
  updateColumns(): void {
    this.nameToIndex.clear();
    if (!this.custom) {
      const indices = new Set<number>();

      // Check for missing indices and duplicates
      const needsIndex = [];
      this.columns.forEach(column => {
        if (column.hasIndex()) {
          const index = column.getIndex();
          if (indices.has(index)) {
            throw new GeoPackageException('Duplicate index: ' + index + ', Table Name: ' + this.tableName);
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
        while (indices.has(++currentIndex)) {}
        column.setIndex(currentIndex);
      });

      // Sort the columns by index
      this.columns.sort((a, b) => {
        return a.getIndex() - b.getIndex();
      });
    }

    this.pkIndex = -1;
    this.columnNames = [];

    for (let index = 0; index < this.columns.length; index++) {
      const column = this.columns[index];
      const columnName = column.getName();
      const lowerCaseColumnName = columnName.toLowerCase();

      if (!this.custom) {
        if (column.getIndex() != index) {
          throw new GeoPackageException('No column found at index: ' + index + ', Table Name: ' + this.tableName);
        }

        if (this.nameToIndex.has(lowerCaseColumnName)) {
          throw new GeoPackageException(
            'Duplicate column found at index: ' + index + ', Table Name: ' + this.tableName + ', Name: ' + columnName,
          );
        }
      }

      if (column.isPrimaryKey()) {
        if (this.pkIndex != -1) {
          let error = 'More than one primary key column was found for ';
          if (this.custom) {
            error = error.concat('custom specified table columns');
          } else {
            error = error.concat('table');
          }
          error = error.concat('. table: ' + this.tableName + ', index1: ' + this.pkIndex + ', index2: ' + index);
          if (this.custom) {
            error = error.concat(', columns: ' + this.columnNames);
          }
          throw new GeoPackageException(error);
        }
        this.pkIndex = index;
      }

      this.columnNames[index] = columnName;
      this.nameToIndex.set(lowerCaseColumnName, index);
    }
  }

  /**
   * Is the primary key modifiable
   *
   * @return true if the primary key is modifiable
   */
  public isPkModifiable(): boolean {
    return this.pkModifiable;
  }

  /**
   * Set if the primary key can be modified
   *
   * @param pkModifiable
   *            primary key modifiable flag
   */
  public setPkModifiable(pkModifiable: boolean): void {
    this.pkModifiable = pkModifiable;
  }

  /**
   * Is value validation against column types enabled
   *
   * @return true if values are validated against column types
   */
  public isValueValidation(): boolean {
    return this.valueValidation;
  }

  /**
   * Set if values should validated against column types
   *
   * @param valueValidation
   *            value validation flag
   */
  public setValueValidation(valueValidation: boolean): void {
    this.valueValidation = valueValidation;
  }

  /**
   * Check for duplicate column names
   *
   * @param index index
   * @param previousIndex previous index
   * @param column column
   */
  duplicateCheck(index: number, previousIndex: number, column: string): void {
    if (previousIndex !== null && previousIndex !== undefined) {
      throw new GeoPackageException(
        'More than one ' +
          column +
          " column was found for table '" +
          this.tableName +
          "'. Index " +
          previousIndex +
          ' and ' +
          index,
      );
    }
  }

  /**
   * Check for the expected data type
   * @param expected expected data type
   * @param column user column
   */
  typeCheck(expected: GeoPackageDataType, column: TColumn): void {
    const actual = column.getDataType();
    if (actual === null || actual === undefined || actual !== expected) {
      throw new GeoPackageException(
        'Unexpected ' +
          column.getName() +
          " column data type was found for table '" +
          this.tableName +
          "', expected: " +
          GeoPackageDataType.nameFromType(expected) +
          ', actual: ' +
          (actual !== null && actual !== undefined ? GeoPackageDataType.nameFromType(actual) : 'null'),
      );
    }
  }

  /**
   * Check for missing columns
   * @param index column index
   * @param column user column
   */
  missingCheck(index: number, column: string): void {
    if (index === null || index === undefined) {
      throw new GeoPackageException('No ' + column + " column was found for table '" + this.tableName + "'");
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
    const index = this.nameToIndex.get(columnName.toLowerCase());
    if (required && (index === null || index === undefined)) {
      let error = 'Column does not exist in ';
      if (this.custom) {
        error = error.concat('custom specified table columns');
      } else {
        error = error.concat('table');
      }
      error = error.concat('. table: ' + this.tableName + ', column: ' + columnName);
      if (this.custom) {
        error = error.concat(', columns: ' + this.columnNames);
      }
      throw new GeoPackageException(error);
    }
    return index;
  }

  /**
   * Get the array of column names
   * @return column names
   */
  getColumnNames(): string[] {
    return this.columnNames;
  }

  /**
   * Get the column name at the index
   * @param index column index
   * @return column name
   */
  getColumnName(index: number): string {
    return this.columnNames[index];
  }

  /**
   * Get the list of columns
   * @return columns
   */
  getColumns(): TColumn[] {
    return this.columns;
  }

  /**
   * Get the column at the index
   * @param index column index
   * @return column
   */
  getColumnForIndex(index: number): TColumn {
    return this.columns[index];
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
    return this.nameToIndex.has(columnName.toLowerCase());
  }

  /**
   * Get the column count
   * @return column count
   */
  columnCount(): number {
    return this.columns.length;
  }

  /**
   * Get the table name
   * @return table name
   */
  getTableName(): string {
    return this.tableName;
  }

  /**
   * Set the table name
   * @param tableName table name
   */
  setTableName(tableName: string): void {
    this.tableName = tableName;
  }

  /**
   * Is custom column specification (partial and/or ordering)
   * @return custom flag
   */
  isCustom(): boolean {
    return this.custom;
  }

  /**
   * Set the custom column specification flag
   * @param custom custom flag
   */
  setCustom(custom: boolean): void {
    this.custom = custom;
  }

  /**
   * Check if the table has a primary key column
   * @return true if has a primary key
   */
  hasPkColumn(): boolean {
    return this.pkIndex >= 0;
  }

  /**
   * Get the primary key column index
   * @return primary key column index
   */
  getPkColumnIndex(): number {
    return this.pkIndex;
  }

  /**
   * Get the primary key column
   * @return primary key column
   */
  getPkColumn(): TColumn {
    let column = null;
    if (this.hasPkColumn()) {
      column = this.columns[this.pkIndex];
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
    return this.columns.filter(column => column.getDataType() === type);
  }

  /**
   * Add a new column
   * @param column new column
   */
  addColumn(column: TColumn): void {
    this.columns.push(column);
    this.updateColumns();
  }

  /**
   * Rename a column
   * @param column column
   * @param newColumnName new column name
   */
  renameColumn(column: TColumn, newColumnName: string): void {
    this.renameColumnWithName(column.getName(), newColumnName);
    column.setName(newColumnName);
  }

  /**
   * Rename a column
   * @param columnName column name
   * @param newColumnName new column name
   */
  renameColumnWithName(columnName: string, newColumnName: string): void {
    this.renameColumnWithIndex(this.getColumnIndexForColumnName(columnName), newColumnName);
  }

  /**
   * Rename a column
   * @param index column index
   * @param newColumnName new column name
   */
  renameColumnWithIndex(index: number, newColumnName: string): void {
    this.columns[index].setName(newColumnName);
    this.updateColumns();
  }

  /**
   * Drop a column
   * @param column column to drop
   */
  dropColumn(column: TColumn): void {
    this.dropColumnWithIndex(column.getIndex());
  }

  /**
   * Drop a column
   * @param columnName column name
   */
  dropColumnWithName(columnName: string): void {
    this.dropColumnWithIndex(this.getColumnIndexForColumnName(columnName));
  }

  /**
   * Drop a column
   * @param index column index
   */
  dropColumnWithIndex(index: number): void {
    this.columns.splice(index, 1);
    this.columns.forEach(column => column.resetIndex());
    this.updateColumns();
  }

  /**
   * Alter a column
   * @param column altered column
   */
  alterColumn(column: TColumn): void {
    const existingColumn = this.getColumn(column.getName());
    const index = existingColumn.getIndex();
    column.setIndex(index);
    this.columns[index] = column;
  }
}
