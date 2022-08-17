/**
 * @memberOf module:extension/nga/style
 * @class IconDao
 */
import { MediaDao } from '../../related/media/mediaDao';
import { IconRow } from './iconRow';
import { IconTable } from './iconTable';
import { UserCustomDao } from '../../../user/custom/userCustomDao';
import { UserCustomResultSet } from '../../../user/custom/userCustomResultSet';
import { UserCustomRow } from '../../../user/custom/userCustomRow';
import { StyleMappingRow } from './styleMappingRow';

/**
 * Icon DAO for reading user icon data tables
 * @extends MediaDao
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
export class IconDao extends MediaDao {
  constructor(dao: UserCustomDao) {
    super(dao, new IconTable(dao.getTable()));
  }

  /**
   * {@inheritDoc}
   */
  public getTable(): IconTable {
    return super.getTable() as IconTable;
  }

  /**
   * {@inheritDoc}
   */
  public newRow(): IconRow {
    return new IconRow(this.getTable());
  }

  /**
   * Get the icon row from the current result set location
   * @param resultSet result set
   * @return icon row
   */
  public getRowWithResultSet(resultSet: UserCustomResultSet): IconRow {
    return this.getRow(resultSet.getRow());
  }

  /**
   * Get a icon row from the user custom row
   * @param row custom row
   * @return icon row
   */
  public getRow(row: UserCustomRow): IconRow {
    return new IconRow(row);
  }

  /**
   * Query for the icon row from a style mapping row
   * @param styleMappingRow style mapping row
   * @return icon row
   */
  public queryForRow(styleMappingRow: StyleMappingRow): IconRow {
    let iconRow = null;
    const userCustomRow = this.queryForIdRow(styleMappingRow.getRelatedId());
    if (userCustomRow != null) {
      iconRow = this.getRow(userCustomRow);
    }

    return iconRow;
  }
}
