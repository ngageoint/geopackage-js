import UserRow from "../../user/userRow";
import UserTable from "../../user/userTable";
import { DublinCoreType } from "./dublinCoreType";
import UserColumn from "../../user/userColumn";

/**
 * Dublin Core Metadata Initiative
 * @module extension/relatedTables
 */

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
  public static hasColumn(table: UserTable | UserRow, type: DublinCoreType): boolean {
    var userTable: UserTable;
    if (table instanceof UserRow) {
      userTable = table.table;
    } else {
      userTable = table;
    }
    var hasColumn = userTable.hasColumn(type.name);
    if (!userTable.hasColumn(type.name)) {
      var synonyms = type.synonyms;
      if (synonyms) {
        for (var i = 0; i < synonyms.length; i++) {
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
   * Get the column from the table for the Dublin Core Type term
   * @param  {module:user/userTable~UserTable|module:user/userRow~UserRow} table user table or user row to check
   * @param  {module:extension/relatedTables~DublinCoreType} type  Dublin Core Type
   * @return {module:user/userColumn~UserColumn}
   */
  public static getColumn(table: UserTable | UserRow, type: DublinCoreType): UserColumn {
    var userTable: UserTable;
    if (table instanceof UserRow) {
      userTable = table.table;
    } else {
      userTable = table;
    }
    var column: UserColumn;
    var hasColumn = userTable.hasColumn(type.name);
    if (hasColumn) {
      column = userTable.getColumnWithColumnName(type.name);
    } else {
      var synonyms = type.synonyms;
      if (synonyms) {
        for (var i = 0; i < synonyms.length; i++) {
          hasColumn = userTable.hasColumn(synonyms[i]);
          if (hasColumn) {
            column = userTable.getColumnWithColumnName(synonyms[i]);
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
  public static getValue(row: UserRow, type: DublinCoreType): any {
    var name = DublinCoreMetadata.getColumn(row, type).name;
    return row.getValueWithColumnName(name);
  }

  /**
   * Set the value in the row for the Dublin Core Type term
   * @param  {module:user/userRow~UserRow} row user row to set the value
   * @param  {module:extension/relatedTables~DublinCoreType} type  Dublin Core Type
   * @param  {Object} value value to set
   */
  public static setValue(row: UserRow, type: DublinCoreType, value: any): void {
    var column = DublinCoreMetadata.getColumn(row, type);
    row.setValueWithColumnName(column.name, value);
  }

}