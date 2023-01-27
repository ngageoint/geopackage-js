import { MediaTable } from './mediaTable';
import { MediaRow } from './mediaRow';
import { UserCustomDao } from '../../../user/custom/userCustomDao';
import { UserCustomResultSet } from '../../../user/custom/userCustomResultSet';
import { UserCustomRow } from '../../../user/custom/userCustomRow';

/**
 * User Media DAO for reading user media data tables
 * @class
 */
export class MediaDao extends UserCustomDao {
  /**
   * Constructor
   * @param dao  user custom data access object
   * @param mediaTable  user custom table
   */
  public constructor(dao: UserCustomDao, mediaTable?: MediaTable) {
    super(dao, mediaTable != null ? mediaTable : new MediaTable(dao.getTable()));
  }

  /**
   * {@inheritDoc}
   */
  public getTable(): MediaTable {
    return super.getTable() as MediaTable;
  }

  /**
   * {@inheritDoc}
   */
  public newRow(): MediaRow {
    return new MediaRow(this.getTable());
  }

  /**
   * Get the media row from the current result set location
   * @param resultSet result set
   * @return media row
   */
  public getRowFromResultSet(resultSet: UserCustomResultSet): MediaRow {
    return this.getRow(resultSet.getRow());
  }

  /**
   * Get a media row from the user custom row
   * @param row custom row
   * @return media row
   */
  public getRow(row: UserCustomRow): MediaRow {
    return new MediaRow(row);
  }

  /**
   * Get the media rows that exist with the provided ids
   *
   * @param ids list of ids
   * @return media rows
   */
  public getRows(ids: number[]): MediaRow[] {
    const mediaRows = [];
    for (const id of ids) {
      const userCustomRow = this.queryForIdRow(id);
      if (userCustomRow != null) {
        mediaRows.push(this.getRow(userCustomRow));
      }
    }
    return mediaRows;
  }
}
