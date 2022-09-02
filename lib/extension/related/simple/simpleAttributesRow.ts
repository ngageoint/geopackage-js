/**
 * SimpleAttributesRow module.
 * @module extension/relatedTables
 */

import { SimpleAttributesTable } from './simpleAttributesTable';
import { UserCustomRow } from '../../../user/custom/userCustomRow';
import { UserCustomColumn } from '../../../user/custom/userCustomColumn';

/**
 * User Simple Attributes Row containing the values from a single result set row
 */
export class SimpleAttributesRow extends UserCustomRow {
  /**
   * Constructor to create an empty row
   * @param table simple attributes table
   */
  public constructor(table: SimpleAttributesTable);

  /**
   * Constructor
   * @param userCustomRow user custom row
   */
  public constructor(userCustomRow: UserCustomRow);

  /**
   * Copy Constructor
   * @param simpleAttributesRow simple attributes row to copy
   */
  public constructor(simpleAttributesRow: SimpleAttributesRow);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof SimpleAttributesTable) {
        super(args[0]);
      } else if (args[0] instanceof UserCustomRow) {
        const userCustomRow = args[0];
        super(
          userCustomRow.getTable(),
          userCustomRow.getColumns(),
          userCustomRow.getRowColumnTypes(),
          userCustomRow.getValues(),
        );
      } else if (args[0] instanceof SimpleAttributesRow) {
        super(args[0]);
      }
    }
  }

  /**
   * {@inheritDoc}
   */
  public getTable(): SimpleAttributesTable {
    return super.getTable() as SimpleAttributesTable;
  }

  /**
   * Get the id column index
   *
   * @return id column index
   */
  public getIdColumnIndex(): number {
    return this.getColumns().getPkColumnIndex();
  }

  /**
   * Get the id column
   *
   * @return id column
   */
  public getIdColumn(): UserCustomColumn {
    return this.getColumns().getPkColumn();
  }

  /**
   * Get the id
   *
   * @return id
   */
  public getId(): number {
    return this.getValueWithIndex(this.getIdColumnIndex());
  }

  /**
   * Copy the row
   *
   * @return row copy
   */
  public copy(): SimpleAttributesRow {
    return new SimpleAttributesRow(this);
  }
}
