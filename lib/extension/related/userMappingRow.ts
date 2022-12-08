import { UserMappingTable } from './userMappingTable';
import { UserColumn } from '../../user/userColumn';
import { UserCustomRow } from '../../user/custom/userCustomRow';

/**
 * UserMappingRow module.
 * @module extension/relatedTables
 */

/**
 * User Mapping Row containing the values from a single result set row
 */
export class UserMappingRow extends UserCustomRow {
  /**
   * Constructor to create an empty row
   * @param table user mapping table
   */
  public constructor(table: UserMappingTable);

  /**
   * Constructor
   * @param userCustomRow user custom row
   */
  public constructor(userCustomRow: UserCustomRow);

  /**
   * Copy Constructor
   * @param userMappingRow user mapping row to copy
   */
  public constructor(userMappingRow: UserMappingRow);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof UserMappingTable) {
        super(args[0]);
      } else if (args[0] instanceof UserCustomRow) {
        const userCustomRow = args[0];
        super(
          userCustomRow.getTable(),
          userCustomRow.getColumns(),
          userCustomRow.getRowColumnTypes(),
          userCustomRow.getValues(),
        );
      } else if (args[0] instanceof UserMappingRow) {
        super(args[0]);
      }
    }
  }

  /**
   * {@inheritDoc}
   */
  public getTable(): UserMappingTable {
    return super.getTable() as UserMappingTable;
  }

  /**
   * Get the base ID column index
   *
   * @return base ID column index
   */
  public getBaseIdColumnIndex(): number {
    return this.getColumns().getColumnIndexForColumnName(UserMappingTable.COLUMN_BASE_ID);
  }

  /**
   * Get the base id column
   * @return {module:user/userColumn~UserColumn}
   */
  getBaseIdColumn(): UserColumn {
    return this.table.getColumn(UserMappingTable.COLUMN_BASE_ID);
  }
  /**
   * Gets the base id
   * @return {Number}
   */
  getBaseId(): number {
    return this.getValue(this.getBaseIdColumn().getName());
  }
  /**
   * Sets the base id
   * @param  {Number} baseId base id
   */
  setBaseId(baseId: number): void {
    this.setValue(this.getBaseIdColumn().getName(), baseId);
  }

  /**
   * Get the related ID column index
   *
   * @return related ID column index
   */
  public getRelatedIdColumnIndex(): number {
    return this.getColumns().getColumnIndexForColumnName(UserMappingTable.COLUMN_RELATED_ID);
  }

  /**
   * Get the related id column
   * @return {module:user/userColumn~UserColumn}
   */
  getRelatedIdColumn(): UserColumn {
    return this.table.getColumn(UserMappingTable.COLUMN_RELATED_ID);
  }
  /**
   * Gets the related id
   * @return {Number}
   */
  getRelatedId(): number {
    return this.getValue(this.getRelatedIdColumn().getName());
  }
  /**
   * Sets the related id
   * @param  {Number} relatedId related id
   */
  setRelatedId(relatedId: number): void {
    this.setValue(this.getRelatedIdColumn().getName(), relatedId);
  }

  /**
   * Copy the row
   * @return row copy
   */
  public copy(): UserMappingRow {
    return new UserMappingRow(this);
  }
}
