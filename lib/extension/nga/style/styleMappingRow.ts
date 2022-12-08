/**
 * @memberOf module:extension/nga/style
 * @class StyleMappingRow
 */

import { UserMappingRow } from '../../related/userMappingRow';
import { UserColumn } from '../../../user/userColumn';
import { StyleTable } from './styleTable';
import { StyleMappingTable } from './styleMappingTable';

/**
 * User Mapping Row containing the values from a single result set row
 */
export class StyleMappingRow extends UserMappingRow {
  /**
   * Get the geometry type name column
   * @return {module:user/userColumn~UserColumn}
   */
  getGeometryTypeNameColumn(): UserColumn {
    return this.table.getColumn(StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME);
  }
  /**
   * Gets the geometry type name
   * @return {string}
   */
  getGeometryTypeName(): string {
    return this.getValue(this.getGeometryTypeNameColumn().getName());
  }
  /**
   * Sets the geometry type name
   * @param  {string} geometryTypeName geometry type name
   */
  setGeometryTypeName(geometryTypeName: string): void {
    this.setValue(this.getGeometryTypeNameColumn().getName(), geometryTypeName);
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
