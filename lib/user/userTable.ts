import { UserColumn } from './userColumn';

import { DataTypes } from '../db/dataTypes';
/**
 * `UserTable` models optional [user data tables](https://www.geopackage.org/spec121/index.html#_options)
 * in a [GeoPackage]{@link module:geoPackage~GeoPackage}.
 *
 * @class
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns user columns
 * @param  {string[]} [requiredColumns] required columns
 */
export class UserTable {
  public static readonly FEATURE_TABLE = 'FEATURE';
  public static readonly TILE_TABLE = 'TILE';
  /**
   * Array of column names
   * @type {string[]}
   */
  columnNames: string[] = [];
  /**
   * Mapping between column names and their index
   * @type {Object}
   */
  nameToIndex: { [key: string]: number } = {};
  uniqueConstraints: { columns: UserColumn[] }[] = [];
  pkIndex: number;

  /**
   *
   * @param table_name the name of the table
   * @param columns array of columns
   * @param requiredColumns required columns
   */
  constructor(public table_name: string, public columns: UserColumn[], public requiredColumns?: string[]) {
    // Sort the columns by index
    this.columns.sort(function(a, b) {
      return a.index - b.index;
    });
    for (let i = 0; i < this.columns.length; i++) {
      const column = this.columns[i];
      if (column.index !== i) {
        throw new Error(
          'Column has wrong index of ' + column.index + ', found at index: ' + i + ', Table Name: ' + this.table_name,
        );
      }
    }
    for (let i = 0; i < this.columns.length; i++) {
      const column = this.columns[i];
      const index = column.index;
      if (column.primaryKey) {
        if (this.pkIndex !== undefined) {
          throw new Error(
            "More than one primary key column was found for table '" +
              this.table_name +
              "'. Index " +
              this.pkIndex +
              ' and ' +
              index,
          );
        }
        this.pkIndex = index;
      }
      this.columnNames.push(column.name);
      this.nameToIndex[column.name] = index;
    }
  }

  getTableType(): string {
    return 'userTable';
  }

  /**
   * Check for duplicate column names
   * @param  {Number} index         index
   * @param  {Number} previousIndex previous index
   * @param  {string} column        column
   * @throws Throws an error if previous index is not undefined
   */
  duplicateCheck(index: number, previousIndex?: number, column?: string): boolean {
    if (previousIndex !== undefined) {
      throw new Error(
        'More than one ' +
          column +
          " column was found for table '" +
          this.table_name +
          "'. Index " +
          previousIndex +
          ' and ' +
          index,
      );
    }
    return true;
  }
  /**
   * Check for the expected data type
   * @param  {module:db/dataTypes~GPKGDataType} expected expected data type
   * @param  {module:user/userColumn~UserColumn} column   column
   * @throws Will throw an error if the actual column type does not match the expected column type
   */
  typeCheck(expected: DataTypes, column: UserColumn): boolean {
    const actual = column.dataType;
    if (!actual || actual !== expected) {
      throw new Error(
        'Unexpected ' +
          column.name +
          " column data type was found for table '" +
          this.table_name +
          "', expected: " +
          DataTypes.nameFromType(expected) +
          ', actual: ' +
          column.dataType,
      );
    }
    return true;
  }
  /**
   * Check for missing columns
   * @param  {Number} index  index
   * @param  {string} column column
   * @throws Will throw an error if no column is found
   */
  missingCheck(index: number, column: string): boolean {
    if (index === undefined || index === null) {
      throw new Error('No ' + column + " column was found for table '" + this.table_name + "'");
    }
    return true;
  }
  /**
   * Get the column index of the column name
   * @param  {string} columnName column name
   * @return {Number} the column index
   * @throws Will throw an error if the column is not found in the table
   */
  getColumnIndex(columnName: string): number {
    const index = this.nameToIndex[columnName];
    if (index === undefined || index === null) {
      throw new Error("Column does not exist in table '" + this.table_name + "', column: " + columnName);
    }
    return index;
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
    return this.columnNames[index];
  }
  /**
   * Get the column from the index
   * @param  {Number} index index
   * @return {module:user/userColumn~UserColumn} column at the index
   */
  getColumnWithIndex(index: number): UserColumn {
    return this.columns[index];
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
  columnCount(): number {
    return this.columns.length;
  }
  /**
   * Get the primary key column
   * @return {module:user/userColumn~UserColumn} the primary key column
   */
  getPkColumn(): UserColumn {
    return this.columns[this.pkIndex];
  }
  /**
   * Get the primary key id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn(): UserColumn {
    return this.getPkColumn();
  }
  /**
   * Add a unique constraint
   * @param uniqueConstraint unique constraint to add
   * @returns number of unique constraints
   */
  addUniqueConstraint(uniqueConstraint: { columns: UserColumn[] }): number {
    return this.uniqueConstraints.push(uniqueConstraint);
  }
}
