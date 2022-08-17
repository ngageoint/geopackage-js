/**
 * @memberOf module:extension/nga/style
 * @class StyleMappingRow
 */

import { UserMappingRow } from '../../related/userMappingRow';
import { UserColumn } from '../../../user/userColumn';
import { StyleTable } from './styleTable';

/**
 * User Mapping Row containing the values from a single result set row
 * @extends UserMappingRow
 * @param  {module:extension/nga/style.StyleMappingTable} styleMappingTable style mapping table
 * @param  {module:db/geoPackageDataType[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
export class StyleMappingRow extends UserMappingRow {
  /**
   * Get the geometry type name column
   * @return {module:user/userColumn~UserColumn}
   */
  getGeometryTypeNameColumn(): UserColumn {
    return this.table.getColumn(StyleTable.COLUMN_NAME);
  }
  /**
   * Gets the geometry type name
   * @return {string}
   */
  getGeometryTypeName(): string {
    return this.getValueWithColumnName(this.getGeometryTypeNameColumn().getName());
  }
  /**
   * Sets the geometry type name
   * @param  {string} geometryTypeName geometry type name
   */
  setGeometryTypeName(geometryTypeName: string): void {
    this.setValueWithColumnName(this.getGeometryTypeNameColumn().getName(), geometryTypeName);
  }

  /**
   * Copy the row
   *
   * @return row copy
   */
  public copy(): StyleMappingRow {
    return new StyleMappingRow(this);
  }
}
