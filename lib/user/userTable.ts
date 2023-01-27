import { GeoPackageDataType } from '../db/geoPackageDataType';
import { Constraint } from '../db/table/constraint';
import { ConstraintType } from '../db/table/constraintType';
import { Contents } from '../contents/contents';
import { Constraints } from '../db/table/constraints';
import type { UserColumns } from './userColumns';
import type { UserColumn } from './userColumn';

/**
 * `UserTable` models optional [user data tables](https://www.geopackage.org/spec121/index.html#_options)
 * in a [GeoPackage]{@link GeoPackage}.
 *
 * @class
 * @param  {string} tableName table name
 * @param  {UserColumn[]} columns user columns
 * @param  {string[]} [requiredColumns] required columns
 */
export abstract class UserTable<TColumn extends UserColumn> {
  /**
   * Default id autoincrement setting
   */
  public static DEFAULT_AUTOINCREMENT = true;

  /**
   * Default primary key not null setting
   */
  public static DEFAULT_PK_NOT_NULL = true;

  /**
   * Columns
   */
  columns: UserColumns<TColumn>;

  /**
   * Constraints
   */
  constraints: Constraints = new Constraints();

  /**
   * Foreign key to Contents
   */
  contents: Contents;

  /**
   * Constructor
   * @param columns columns
   */
  constructor(columns: UserColumns<TColumn>);

  /**
   * Constructor
   * @param userTable UserTable
   */
  constructor(userTable: UserTable<TColumn>);

  /**
   * Contructor
   * @param args
   */
  constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof UserTable) {
        const userTable = args[0];
        this.columns = userTable.columns.copy();
        this.constraints = userTable.constraints.copy();
        this.contents = userTable.contents;
      } else {
        this.columns = args[0];
        this.constraints = new Constraints();
      }
    }
  }

  /**
   * Copy the table
   * @return copied table
   */
  public abstract copy(): UserTable<TColumn>;

  /**
   * Get the contents data type
   * @return data type
   */
  public abstract getDataType(): string;

  /**
   * Get the contents data type from the contents or use the default
   *
   * @param defaultType default data type
   * @return contents or default data type
   */
  protected getDataTypeOrDefault(defaultType: string): string {
    let dataType = null;
    if (this.contents != null) {
      dataType = this.contents.getDataTypeName();
    }
    if (dataType == null) {
      dataType = defaultType;
    }
    return dataType;
  }

  /**
   * Create user columns for a subset of table columns
   * @param columns columns
   * @return user columns
   */
  public abstract createUserColumns(columns: TColumn[]): UserColumns<TColumn>;

  /**
   * Create user columns for a subset of table columns
   * @param columnNames column names
   * @return user columns
   */
  public createUserColumnsFromColumnNames(columnNames: string[]): UserColumns<TColumn> {
    return this.createUserColumns(this.getColumnsForColumnNames(columnNames));
  }

  /**
   * Get the user columns
   * @return user columns
   */
  public getUserColumns(): UserColumns<TColumn> {
    return this.columns;
  }

  /**
   * Get the column index of the column name
   * @param columnName column name
   * @return column index
   */
  public getColumnIndex(columnName: string): number {
    return this.columns.getColumnIndexForColumnName(columnName);
  }

  /**
   * Get the array of column names
   * @return column names
   */
  public getColumnNames(): string[] {
    return this.columns.getColumnNames();
  }

  /**
   * Get the column name at the index
   * @param index column index
   * @return column name
   */
  public getColumnName(index: number): string {
    return this.columns.getColumnName(index);
  }

  /**
   * Get the list of columns
   * @return columns
   */
  public getColumns(): TColumn[] {
    return this.columns.getColumns();
  }

  /**
   * Get the columns from the column names
   * @param columnNames column names
   * @return columns
   */
  public getColumnsForColumnNames(columnNames: string[]): TColumn[] {
    const columns = [];
    for (const columnName of columnNames) {
      columns.push(this.getColumn(columnName));
    }
    return columns;
  }

  /**
   * Get the column at the index
   * @param index column index
   * @return column
   */
  public getColumnForIndex(index: number): TColumn {
    return this.columns.getColumnForIndex(index);
  }

  /**
   * Get the column of the column name
   * @param columnName column name
   * @return column
   */
  public getColumn(columnName: string): TColumn {
    return this.columns.getColumn(columnName);
  }

  /**
   * Check if the table has the column
   *
   * @param columnName
   *            column name
   * @return true if has the column
   */
  public hasColumn(columnName: string): boolean {
    return this.columns.hasColumn(columnName);
  }

  /**
   * Get the column count
   *
   * @return column count
   */
  public columnCount(): number {
    return this.columns.columnCount();
  }

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.columns.getTableName();
  }

  /**
   * Set the table name
   *
   * @param tableName
   *            table name
   */
  public setTableName(tableName: string): void {
    this.columns.setTableName(tableName);
  }

  /**
   * Check if the table has a primary key column
   *
   * @return true if has a primary key
   */
  public hasPkColumn(): boolean {
    return this.columns.hasPkColumn();
  }

  /**
   * Get the primary key column index
   *
   * @return primary key column index
   */
  public getPkColumnIndex(): number {
    return this.columns.getPkColumnIndex();
  }

  /**
   * Get the primary key column
   *
   * @return primary key column
   */
  public getPkColumn(): TColumn {
    return this.columns.getPkColumn();
  }

  /**
   * Get the primary key column name
   *
   * @return primary key column name
   */
  public getPkColumnName(): string {
    return this.columns.getPkColumnName();
  }

  /**
   * Add constraint
   *
   * @param constraint
   *            constraint
   */
  public addConstraint(constraint: Constraint): void {
    this.constraints.add(constraint);
  }

  /**
   * Add constraints
   *
   * @param constraints
   *            constraints
   */
  public addConstraints(constraints: Constraint[]): void {
    this.constraints.addConstraintArray(constraints);
  }

  /**
   * Add constraints
   *
   * @param constraints
   *            constraints
   */
  public addConstraintsWithConstraints(constraints: Constraints): void {
    this.addConstraints(constraints.all());
  }

  /**
   * Check if has constraints
   *
   * @return true if has constraints
   */
  public hasConstraints(): boolean {
    return this.constraints.has();
  }

  /**
   * Check if has constraints of the provided type
   *
   * @param type
   *            constraint type
   * @return true if has constraints
   */
  public hasConstraintsForType(type: ConstraintType): boolean {
    return this.constraints.hasType(type);
  }

  /**
   * Get the constraints
   *
   * @return constraints
   */
  public getConstraints(): Constraints {
    return this.constraints;
  }

  /**
   * Get the constraints of the provided type
   *
   * @param type
   *            constraint type
   * @return constraints
   */
  public getConstraintsByType(type: ConstraintType): Constraint[] {
    return this.constraints.getConstraintsByType(type);
  }

  /**
   * Clear the constraints
   *
   * @return cleared constraints
   */
  public clearConstraints(): Constraint[] {
    return this.constraints.clear();
  }

  /**
   * Clear the constraints of the provided type
   *
   * @param type
   *            constraint type
   * @return cleared constraints
   */
  public clearConstraintsByType(type: ConstraintType): Constraint[] {
    return this.constraints.clearConstraintsByType(type);
  }

  /**
   * Get the columns with the provided data type
   *
   * @param type
   *            data type
   * @return columns
   */
  public columnsOfType(type: GeoPackageDataType): TColumn[] {
    return this.columns.columnsOfType(type);
  }

  /**
   * Get the contents
   *
   * @return contents
   */
  public getContents(): Contents {
    return this.contents;
  }

  /**
   * Set the contents
   *
   * @param contents
   *            contents
   */
  public setContents(contents: Contents): void {
    this.contents = contents;
    if (contents != null) {
      this.validateContents(contents);
    }
  }

  /**
   * Validate that the set contents are valid
   *
   * @param contents contents
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  protected validateContents(contents: Contents): void {}

  /**
   * Is the primary key modifiable
   *
   * @return true if the primary key is modifiable
   */
  public isPkModifiable(): boolean {
    return this.columns.isPkModifiable();
  }

  /**
   * Set if the primary key can be modified
   *
   * @param pkModifiable
   *            primary key modifiable flag
   */
  public setPkModifiable(pkModifiable: boolean): void {
    this.columns.setPkModifiable(pkModifiable);
  }

  /**
   * Is value validation against column types enabled
   *
   * @return true if values are validated against column types
   */
  public isValueValidation(): boolean {
    return this.columns.isValueValidation();
  }

  /**
   * Set if values should validated against column types
   *
   * @param valueValidation
   *            value validation flag
   */
  public setValueValidation(valueValidation: boolean): void {
    this.columns.setValueValidation(valueValidation);
  }

  /**
   * Add a new column
   *
   * @param column
   *            new column
   */
  public addColumn(column: TColumn): void {
    this.columns.addColumn(column);
  }

  /**
   * Rename a column
   *
   * @param column
   *            column
   * @param newColumnName
   *            new column name
   */
  public renameColumn(column: TColumn, newColumnName: string): void {
    this.columns.renameColumn(column, newColumnName);
  }

  /**
   * Rename a column
   *
   * @param columnName
   *            column name
   * @param newColumnName
   *            new column name
   */
  public renameColumnWithName(columnName: string, newColumnName: string): void {
    this.columns.renameColumnWithName(columnName, newColumnName);
  }

  /**
   * Rename a column
   *
   * @param index
   *            column index
   * @param newColumnName
   *            new column name
   */
  public renameColumnWithIndex(index: number, newColumnName: string): void {
    this.columns.renameColumnWithIndex(index, newColumnName);
  }

  /**
   * Drop a column
   *
   * @param column
   *            column to drop
   */
  public dropColumn(column: TColumn): void {
    this.columns.dropColumn(column);
  }

  /**
   * Drop a column
   *
   * @param columnName
   *            column name
   */
  public dropColumnWithName(columnName: string): void {
    this.columns.dropColumnWithName(columnName);
  }

  /**
   * Drop a column
   *
   * @param index
   *            column index
   */
  public dropColumnWithIndex(index: number): void {
    this.columns.dropColumnWithIndex(index);
  }

  /**
   * Alter a column
   *
   * @param column
   *            altered column
   */
  public alterColumn(column: TColumn): void {
    this.columns.alterColumn(column);
  }
}
