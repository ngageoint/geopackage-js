/**
 * @memberOf module:extension/nga/style
 * @class StyleDao
 */

import { StyleTable } from './styleTable';
import { AttributesDao } from '../../../attributes/attributesDao';
import { StyleRow } from './styleRow';
import { AttributesResultSet } from '../../../attributes/attributesResultSet';
import { AttributesRow } from '../../../attributes/attributesRow';
import { StyleMappingRow } from './styleMappingRow';

/**
 * Style DAO for reading style tables
 * @extends {AttributesDao}
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
export class StyleDao extends AttributesDao {
  constructor(dao: AttributesDao) {
    super(dao.getDatabase(), dao.getDb(), new StyleTable(dao.getTable()));
  }

  getTable(): StyleTable {
    return super.getTable() as StyleTable;
  }

  /**
   * {@inheritDoc}
   */
  public newRow(): StyleRow {
    return new StyleRow(this.getTable());
  }

  /**
   * Get the style row from the current result set location
   * @param resultSet result set
   * @return style row
   */
  public getRowWithResultSet(resultSet: AttributesResultSet): StyleRow {
    return this.getRow(resultSet.getRow());
  }

  /**
   * Get a style row from the attributes row
   * @param row attributes row
   * @return style row
   */
  public getRow(row: AttributesRow): StyleRow {
    return new StyleRow(row);
  }

  /**
   * Query for the style row from a style mapping row
   * @param styleMappingRow style mapping row
   * @return style row
   */
  public queryForRow(styleMappingRow: StyleMappingRow): StyleRow {
    let styleRow = null;
    const attributesRow = this.queryForIdRow(styleMappingRow.getRelatedId());
    if (attributesRow != null) {
      styleRow = this.getRow(attributesRow);
    }
    return styleRow;
  }
}
