/**
 * @module features/user/featureColumn
 */

import { UserColumn } from '../../user/userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { DBValue } from '../../db/dbAdapter';
import { GeometryType } from './geometryType';
import { TableColumn  } from '../../db/table/tableColumn';
import { UserTable } from '../../user/userTable';

/**
 * Represents a user feature column
 * @class
 * @extends UserColumn
 */
export class FeatureColumn extends UserColumn {
  geometryType: GeometryType;

  constructor(
    index: number,
    name: string,
    dataType: GeoPackageDataType,
    max?: number,
    notNull?: boolean,
    defaultValue?: any,
    primaryKey?: boolean,
    geometryType?: GeometryType,
    autoincrement?: boolean,
  ) {
    super(index, name, dataType, max, notNull, defaultValue, primaryKey, autoincrement);
    this.geometryType = geometryType;
    this.type = this.getTypeName(name, dataType, geometryType);
  }
  /**
   *  Create a new primary key column
   *
   *  @param {Number} index column index
   *  @param {string} name  column name
   *  @param {boolean} autoincrement  column name
   *
   *  @return feature column
   */
  static createPrimaryKeyColumn(
    index: number,
    name: string,
    autoincrement: boolean = UserTable.DEFAULT_AUTOINCREMENT
  ): FeatureColumn {
    return new FeatureColumn(index, name, GeoPackageDataType.INTEGER, undefined, true, undefined, true, undefined, autoincrement);
  }
  /**
   *  Create a new geometry column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {GeometryType} type
   *  @param {Boolean} notNull      not null
   *  @param {Object} defaultValue default value or nil
   *
   *  @return feature column
   */
  static createGeometryColumn(
    index: number,
    name: string,
    type: GeometryType,
    notNull: boolean,
    defaultValue?: DBValue,
  ): FeatureColumn {
    if ((type === null || type === undefined)) {
      throw new Error('Geometry Type is required to create column: ' + name);
    }
    return new FeatureColumn(index, name, GeoPackageDataType.BLOB, undefined, notNull, defaultValue, false, type, false);
  }

  /**
   * Create a new column
   * @param index
   * @param name
   * @param type
   * @param notNull
   * @param defaultValue
   * @param max
   * @param autoincrement
   */
  static createColumn(
    index: number,
    name: string,
    type: GeoPackageDataType,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
    autoincrement?: boolean,
  ): FeatureColumn {
    return new FeatureColumn(index, name, type, max, notNull, defaultValue, false, undefined, autoincrement);
  }

  /**
   * Get the type name from the data and geometry type
   * @param name column name
   * @param dataType data type
   * @param geometryType  geometry type
   * @return type name
   */
  getTypeName(name: string, dataType: GeoPackageDataType, geometryType?: GeometryType): string {
    let type;
    if (geometryType !== null && geometryType !== undefined) {
      type = GeometryType.nameFromType(geometryType);
    } else {
      type = super.getTypeName(name, dataType);
    }
    return type;
  }

  /**
   * Attempt to get the geometry type of the table column
   * @param tableColumn table column
   * @return geometry type
   */
  static getGeometryTypeFromTableColumn(tableColumn: TableColumn): GeometryType {
    let geometryType = null;
    if (tableColumn.isDataType(GeoPackageDataType.BLOB)) {
      geometryType = GeometryType.fromName(tableColumn.type);
    }
    return geometryType;
  }

  /**
   * Copy the column
   * @return copied column
   */
  copy(): FeatureColumn {
    return new FeatureColumn(this.index, this.name, this.dataType, this.max, this.notNull, this.defaultValue, this.primaryKey, this.geometryType, this.autoincrement);
  }

  /**
   * Determine if this column is a geometry
   *
   * @return true if a geometry column
   */
  isGeometry(): boolean {
    return this.geometryType !== null;
  }

  /**
   * When a geometry column, gets the geometry type
   * @return geometry type
   */
  getGeometryType(): GeometryType {
    return this.geometryType;
  }

}
