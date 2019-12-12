/**
 * @module user/userColumn
 */

import DataTypes from '../db/dataTypes';

/**
 * A `UserColumn` is meta-data about a single column from a {@link module:/user/userTable~UserTable}.
 *
 * @class
 * @param {Number} index column index
 * @param {string} name column name
 * @param {module:db/dataTypes~GPKGDataType} dataType data type of the column
 * @param {?Number} max max value
 * @param {Boolean} notNull not null
 * @param {?Object} defaultValue default value or null
 * @param {Boolean} primaryKey `true` if this column is part of the table's primary key
 */
export default class UserColumn {
  index: number;
  name: string;
  dataType: any;
  max: number;
  min: number;
  notNull: boolean;
  defaultValue: any;
  primaryKey: boolean;
  constructor(index: number, name: string, dataType: any, max?: number, notNull?: boolean, defaultValue?: any, primaryKey?: boolean) {
    this.index = index;
    this.name = name;
    this.dataType = dataType;
    this.max = max;
    this.notNull = notNull;
    this.defaultValue = defaultValue;
    this.primaryKey = primaryKey;
    this.validateMax();
  }
  /**
   * Gets the type name
   * @return {module:db/dataTypes~GPKGDataType}
   */
  getTypeName() {
    var type = undefined;
    if (this.dataType !== DataTypes.GPKGDataType.GPKG_DT_GEOMETRY) {
      type = DataTypes.nameFromType(this.dataType);
    }
    return type;
  }
  /**
   * Validate that if max is set, the data type is text or blob
   */
  validateMax() {
    if (this.max && this.dataType !== DataTypes.GPKGDataType.GPKG_DT_TEXT && this.dataType !== DataTypes.GPKGDataType.GPKG_DT_BLOB) {
      throw new Error('Column max is only supported for TEXT and BLOB columns. column: ' + this.name + ', max: ' + this.max + ', type: ' + this.dataType);
    }
  }
  /**
   *  Create a new primary key column
   *
   *  @param {Number} index column index
   *  @param {string} name  column name
   *
   *  @return {module:user/userColumn~UserColumn} created column
   */
  static createPrimaryKeyColumnWithIndexAndName(index: number, name: string): UserColumn {
    return new UserColumn(index, name, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true, undefined, true);
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
   *  @return {module:user/userColumn~UserColumn} created column
   */
  static createColumnWithIndex(index: number, name: string, type: any, notNull?: boolean, defaultValue?: any): UserColumn {
    return UserColumn.createColumnWithIndexAndMax(index, name, type, undefined, notNull, defaultValue);
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
   *  @return {module:user/userColumn~UserColumn} created column
   */
  static createColumnWithIndexAndMax(index: number, name: string, type: any, max: number, notNull: boolean, defaultValue: any): UserColumn {
    return new UserColumn(index, name, type, max, notNull, defaultValue, false);
  }
}