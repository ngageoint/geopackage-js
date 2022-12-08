/**
 * SimpleAttributesDao module.
 * @module extension/relatedTables
 */
import { SimpleAttributesTable } from './simpleAttributesTable';
import { SimpleAttributesRow } from './simpleAttributesRow';
import { UserCustomDao } from '../../../user/custom/userCustomDao';
import { UserCustomResultSet } from '../../../user/custom/userCustomResultSet';
import { UserCustomRow } from '../../../user/custom/userCustomRow';

/**
 * User Simple Attributes DAO for reading user simple attributes data tables
 */
export class SimpleAttributesDao extends UserCustomDao {
  /**
   * Constructor
   * @param dao user custom data access object
   * @param simpleAttributesTable simple attributes table
   */
  public constructor(dao: UserCustomDao, simpleAttributesTable: SimpleAttributesTable = null) {
    super(dao, simpleAttributesTable != null ? simpleAttributesTable : new SimpleAttributesTable(dao.getTable()));
  }

  /**
   * {@inheritDoc}
   */
  public getTable(): SimpleAttributesTable {
    return super.getTable() as SimpleAttributesTable;
  }

  /**
   * {@inheritDoc}
   */
  public newRow(): SimpleAttributesRow {
    return new SimpleAttributesRow(this.getTable());
  }

  /**
   * Get the simple attributes row from the current result set location
   *
   * @param resultSet result set
   * @return simple attributes row
   */
  public getRowFromResultSet(resultSet: UserCustomResultSet): SimpleAttributesRow {
    return this.getRow(resultSet.getRow());
  }

  /**
   * Get a simple attributes row from the user custom row
   *
   * @param row
   *            custom row
   * @return simple attributes row
   */
  public getRow(row: UserCustomRow): SimpleAttributesRow {
    return new SimpleAttributesRow(row);
  }

  /**
   * Get the simple attributes rows that exist with the provided ids
   *
   * @param ids list of ids
   * @return simple attributes rows
   */
  public getRows(ids: number[]): SimpleAttributesRow[] {
    const simpleAttributesRows = [];
    for (const id of ids) {
      const userCustomRow = this.queryForId(id);
      if (userCustomRow != null) {
        simpleAttributesRows.push(this.getRow(userCustomRow));
      }
    }
    return simpleAttributesRows;
  }
}
