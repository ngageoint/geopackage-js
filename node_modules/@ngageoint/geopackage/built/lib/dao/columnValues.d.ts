import { UserColumn } from '../user/userColumn';
/**
 * @module dao/columnValues
 */
/**
 * Structure to define columns in a table
 * @class ColumnValues
 */
export declare class ColumnValues {
    values: {
        [key: string]: UserColumn | any;
    };
    columns: string[];
    /**
     * adds a column to the structure
     * @param  {string} columnName  name of column to add
     * @param  {module:user/userColumn~UserColumn} column column to add
     */
    addColumn(columnName: string, column: UserColumn | any): void;
    /**
     * Gets the column by name
     * @param  {string} columnName name of column
     * @return {module:user/userColumn~UserColumn}            user column
     */
    getValue(columnName: string): UserColumn | any;
}
