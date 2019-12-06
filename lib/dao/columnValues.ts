import UserColumn from "../user/userColumn";

/**
 * @module dao/columnValues
 */
/**
 * Structure to define columns in a table
 * @class ColumnValues
 */
export default class ColumnValues {
  values: { [key: string]: UserColumn | string};
  columns: string[];
  constructor() {
    this.values = {};
    this.columns = [];
  }
  /**
   * adds a column to the structure
   * @param  {string} columnName  name of column to add
   * @param  {module:user/userColumn~UserColumn} column column to add
   */
  addColumn(columnName: string, column: UserColumn | string) {
    this.columns.push(columnName);
    this.values[columnName] = column;
  }
  /**
   * Gets the column by name
   * @param  {string} columnName name of column
   * @return {module:user/userColumn~UserColumn}            user column
   */
  getValue(columnName: string): UserColumn | string {
    return this.values[columnName];
  }
}


