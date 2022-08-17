/**
 * Dublin Core Metadata Initiative
 * @module extension/relatedTables
 */
import { UserRow } from '../../../user/userRow';
import { UserTable } from '../../../user/userTable';
import { DublinCoreType } from './dublinCoreType';
import { UserColumn } from '../../../user/userColumn';

/**
 * Dublin Core Metadata Initiative
 * @class
 */
export class DublinCoreMetadata {
  /**
   * Check if the table has a column for the Dublin Core Type term
   * @param  {module:user/userTable~UserTable|module:user/userRow~UserRow} table user table or user row to check
   * @param  {module:extension/relatedTables~DublinCoreType} type  Dublin Core Type
   * @return {Boolean}
   */
  public static hasColumn(
    table: UserTable<UserColumn> | UserRow<UserColumn, UserTable<UserColumn>>,
    type: DublinCoreType,
  ): boolean {
    let userTable: UserTable<UserColumn>;
    if (table instanceof UserRow) {
      userTable = table.getTable();
    } else {
      userTable = table;
    }
    let hasColumn = userTable.hasColumn(type.getName());
    if (!userTable.hasColumn(type.getName())) {
      const synonyms = type.synonyms;
      if (synonyms) {
        for (let i = 0; i < synonyms.length; i++) {
          hasColumn = userTable.hasColumn(synonyms[i]);
          if (hasColumn) {
            break;
          }
        }
      }
    }
    return hasColumn;
  }

  /**
   * Get the column from the row for the Dublin Core Type term
   * @param table
   * @param type
   */
  public static getColumn(
    table: UserTable<UserColumn> | UserRow<UserColumn, UserTable<UserColumn>>,
    type: DublinCoreType,
  ): UserColumn {
    let userTable: UserTable<UserColumn>;
    if (table instanceof UserRow) {
      userTable = table.getTable();
    } else {
      userTable = table;
    }
    let column: UserColumn;
    let hasColumn = userTable.hasColumn(type.getName());
    if (hasColumn) {
      column = userTable.getColumn(type.getName());
    } else {
      const synonyms = type.synonyms;
      if (synonyms) {
        for (let i = 0; i < synonyms.length; i++) {
          hasColumn = userTable.hasColumn(synonyms[i]);
          if (hasColumn) {
            column = userTable.getColumn(synonyms[i]);
            break;
          }
        }
      }
    }
    return column;
  }

  /**
   * Get the value from the row for the Dublin Core Type term
   * @param  {module:user/userRow~UserRow} row user row to get value from
   * @param  {module:extension/relatedTables~DublinCoreType} type  Dublin Core Type
   * @return {Object}
   */
  public static getValue(row: UserRow<UserColumn, UserTable<UserColumn>>, type: DublinCoreType): any {
    const name = DublinCoreMetadata.getColumn(row, type).getName();
    return row.getValueWithColumnName(name);
  }

  /**
   * Set the value in the row for the Dublin Core Type term
   * @param  {module:user/userRow~UserRow} row user row to set the value
   * @param  {module:extension/relatedTables~DublinCoreType} type  Dublin Core Type
   * @param  {Object} value value to set
   */
  public static setValue(row: UserRow<UserColumn, UserTable<UserColumn>>, type: DublinCoreType, value: any): void {
    const column = DublinCoreMetadata.getColumn(row, type);
    row.setValueWithColumnName(column.getName(), value);
  }
}
