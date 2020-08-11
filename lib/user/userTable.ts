import { UserColumn } from './userColumn';

import { GeoPackageDataType } from '../db/geoPackageDataType';
import { Constraint } from '../db/table/constraint';
import { ConstraintType } from '../db/table/constraintType';
import {Contents} from '../core/contents/contents';
import { UserColumns } from './userColumns';
/**
 * `UserTable` models optional [user data tables](https://www.geopackage.org/spec121/index.html#_options)
 * in a [GeoPackage]{@link module:geoPackage~GeoPackage}.
 *
 * @class
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns user columns
 * @param  {string[]} [requiredColumns] required columns
 */
export class UserTable<TColumn extends UserColumn> {
  public static readonly FEATURE_TABLE = 'FEATURE';
  public static readonly TILE_TABLE = 'TILE';

  /**
   * Columns
   */
  columns: UserColumns<TColumn>;

  /**
   * Constraints
   */
  constraints: Constraint[] = [];
  /**
   * Type Constraints
   */
  typedContraints:  Map<ConstraintType, Constraint[]> = new Map<ConstraintType, Constraint[]>();

  /**
   * Foreign key to Contents
   */
  contents: Contents;

  /**
   *
   * @param columns
   */
  constructor(columns: UserColumns<TColumn>) {
    this.columns = columns;
    this.constraints = [];
    this.typedContraints = new Map<ConstraintType, Constraint[]>();
  }

  copy(): UserTable<TColumn> {
    const userTableCopy = new UserTable<TColumn>(this.columns.copy());
    this.constraints.forEach(constraint => {
      userTableCopy.addConstraint(constraint.copy());
    });
    userTableCopy.contents = this.contents.copy();
    return userTableCopy;
  }

  getTableName(): string {
    return this.columns.getTableName();
  }

  get tableType(): string {
    return 'userTable';
  }

  /**
   * Get the user columns
   * @return user columns
   */
  getUserColumns(): UserColumns<TColumn> {
    return this.columns;
  }

  /**
   * Get the column index of the column name
   * @param  {string} columnName column name
   * @return {Number} the column index
   * @throws Will throw an error if the column is not found in the table
   */
  getColumnIndex(columnName: string): number {
    return this.columns.getColumnIndexForColumnName(columnName);
  }
  /**
   * Check if the table has the column
   * @param  {string} columnName name of the column
   * @return {Boolean}            true if the column exists in the table
   */
  hasColumn(columnName: string): boolean {
    try {
      this.getColumnIndex(columnName);
      return true;
    } catch (e) {
      return false;
    }
  }
  /**
   * Get the column name from the index
   * @param  {Number} index index
   * @return {string} the column name
   */
  getColumnNameWithIndex(index: number): string {
    return this.columns.getColumnName(index);
  }
  /**
   * Get the column from the index
   * @param  {Number} index index
   * @return {module:user/userColumn~UserColumn} column at the index
   */
  getColumnWithIndex(index: number): UserColumn {
    return this.columns.getColumnForIndex(index);
  }
  /**
   * Get column with the column name
   * @param  {string} columnName column name
   * @return {module:user/userColumn~UserColumn}            column at the index
   */
  getColumnWithColumnName(columnName: string): UserColumn {
    return this.getColumnWithIndex(this.getColumnIndex(columnName));
  }
  /**
   * Get the column count
   * @return {Number} the count of the columns
   */
  getColumnCount(): number {
    return this.columns.columnCount();
  }
  /**
   * Get the primary key column
   * @return {module:user/userColumn~UserColumn} the primary key column
   */
  getPkColumn(): UserColumn {
    return this.columns.getPkColumn();
  }

  /**
   * Get the primary key column name
   * @return primary key column name
   */
  getPkColumnName(): string {
    return this.columns.getPkColumnName();
  }

  /**
   * Get the column index of the id column
   * @return {Number}
   */
  getIdColumnIndex(): number {
    return this.columns.getPkColumnIndex();
  }
  /**
   * Get the primary key id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn(): UserColumn {
    return this.getPkColumn();
  }

  /**
   * Add constraint
   * @param constraint constraint
   */
  addConstraint(constraint: Constraint) {
    this.constraints.push(constraint);
    let typeConstraints = this.typedContraints.get(constraint.type);
    if (typeConstraints === null || typeConstraints === undefined) {
      typeConstraints = [];
      this.typedContraints.set(constraint.type, typeConstraints);
    }
    typeConstraints.push(constraint);
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addConstraints(constraints: Constraint[]) {
    constraints.forEach(constraint => {
      this.addConstraint(constraint);
    });
  }

  /**
   * Check if has constraints
   * @return true if has constraints
   */
  hasConstraints(): boolean {
    return this.constraints.length > 0;
  }

  /**
   * Get the constraints
   * @return constraints
   */
  getConstraints(): Constraint[] {
    return this.constraints;
  }

  /**
   * Get the constraints of the provided type
   * @param type  constraint type
   * @return constraints
   */
  getConstraintsByType(type: ConstraintType): Constraint[] {
    let constraints = this.typedContraints.get(type);
    if (constraints === null || constraints === undefined) {
      constraints = [];
    }
    return constraints;
  }

  /**
   * Clear the constraints
   * @return cleared constraints
   */
  clearConstraints(): Constraint[] {
    let constraintsCopy = Array.from(this.constraints);
    this.constraints = [];
    this.typedContraints.clear();
    return constraintsCopy;
  }

  /**
   * Get the columns with the provided data type
   * @param type data type
   * @return columns
   */
  columnsOfType(type: GeoPackageDataType): UserColumn[] {
    return this.columns.columnsOfType(type);
  }

  /**
   * Get the contents
   * @return contents
   */
  getContents(): Contents {
    return this.contents;
  }

  /**
   * Set the contents
   * @param contents contents
   */
  setContents(contents: Contents) {
    this.contents = contents;
    if (contents !== null && contents !== undefined) {
      this.validateContents(contents);
    }
  }

  /**
   * Validate that the set contents are valid
   * @param contents contents
   */
  validateContents(contents: Contents) {

  }

  /**
   * Add a new column
   * @param column new column
   */
  addColumn(column: TColumn) {
    this.columns.addColumn(column);
  }

  /**
   * Rename a column
   * @param column column
   * @param newColumnName new column name
   */
  renameColumn(column: TColumn, newColumnName: string) {
    this.columns.renameColumn(column, newColumnName);
  }

  /**
   * Rename a column
   * @param columnName column name
   * @param newColumnName new column name
   */
  renameColumnWithName(columnName: string, newColumnName: string) {
    this.columns.renameColumnWithName(columnName, newColumnName);
  }

  /**
   * Rename a column
   * @param index column index
   * @param newColumnName new column name
   */
  renameColumnAtIndex(index: number, newColumnName: string) {
    this.columns.renameColumnWithIndex(index, newColumnName);
  }

  /**
   * Drop a column
   * @param column column to drop
   */
  dropColumn(column: TColumn) {
    this.columns.dropColumn(column);
  }

  /**
   * Drop a column
   * @param columnName column name
   */
  dropColumnWithName(columnName: string) {
    this.columns.dropColumnWithName(columnName);
  }

  /**
   * Drop a column
   * @param index column index
   */
  dropColumnWithIndex(index: number) {
    this.columns.dropColumnWithIndex(index);
  }

  /**
   * Alter a column
   * @param column altered column
   */
  alterColumn(column: TColumn) {
    this.columns.alterColumn(column);
  }

}
