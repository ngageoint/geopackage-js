/**
 * @module features/user/featureColumn
 */

import { UserColumn } from '../../user/userColumn';
import { DataTypes } from '../../db/dataTypes';

/**
 * Represents a user feature column
 * @class
 * @extends UserColumn
 */
export class FeatureColumn extends UserColumn {
  geometryType: any;

  constructor(
    index: number,
    name: string,
    dataType: any,
    max?: number,
    notNull?: boolean,
    defaultValue?: any,
    primaryKey?: boolean,
    geometryType?: any,
  ) {
    super(index, name, dataType, max, notNull, defaultValue, primaryKey);
    this.geometryType = geometryType;
    if (!geometryType && dataType === DataTypes.GEOMETRY) {
      throw new Error('Data or Geometry Type is required to create column: ' + name);
    }
  }
  getTypeName(): string {
    if (this.isGeometry()) {
      return DataTypes.nameFromType(DataTypes.GEOMETRY);
    }
    return this.dataType !== undefined && DataTypes.nameFromType(this.dataType);
  }
  /**
   * Determine if this column is a geometry
   * @return {Boolean} true if a geometry column
   */
  isGeometry(): boolean {
    return this.geometryType !== undefined;
  }
  /**
   *  Create a new primary key column
   *
   *  @param {Number} index column index
   *  @param {string} name  column name
   *
   *  @return feature column
   */
  static createPrimaryKeyColumnWithIndexAndName(index: number, name: string): FeatureColumn {
    return new FeatureColumn(index, name, DataTypes.INTEGER, undefined, true, undefined, true);
  }
  /**
   *  Create a new geometry column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {String} type         geometry type
   *  @param {Boolean} notNull      not null
   *  @param {Object} defaultValue default value or nil
   *
   *  @return feature column
   */
  static createGeometryColumn(
    index: number,
    name: string,
    type: string,
    notNull: boolean,
    defaultValue?: any,
  ): FeatureColumn {
    return new FeatureColumn(index, name, type, undefined, notNull, defaultValue, false, type);
  }
  /**
   *  Create a new column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {module:db/dataTypes~GPKGDataType} type         data type
   *  @param {Boolean} [notNull]      not null
   *  @param {Object} [defaultValue] default value or nil
   *
   *  @return feature column
   */
  static createColumnWithIndex(
    index: number,
    name: string,
    type: any,
    notNull?: boolean,
    defaultValue?: any,
  ): FeatureColumn {
    return FeatureColumn.createColumnWithIndexAndMax(index, name, type, undefined, notNull, defaultValue);
  }
  /**
   *  Create a new column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {module:db/dataTypes~GPKGDataType} type         data type
   *  @param {Number} max max value
   *  @param {Boolean} notNull      not null
   *  @param {Object} defaultValue default value or nil
   *
   *  @return feature column
   */
  static createColumnWithIndexAndMax(
    index: number,
    name: string,
    type: any,
    max: number,
    notNull: boolean,
    defaultValue: any,
  ): FeatureColumn {
    return new FeatureColumn(index, name, type, max, notNull, defaultValue, false);
  }
}
