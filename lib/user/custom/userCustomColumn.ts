/**
 * @module user/custom
 */

import { UserColumn } from '../userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { DBValue } from '../../db/dbAdapter';
import { UserTableDefaults } from "../userTableDefaults";

/**
 * Create a new user custom columnd
 *  @param {Number} index        column index
 *  @param {string} name         column name
 *  @param {module:db/geoPackageDataType~GPKGDataType} dataType  data type
 *  @param {Number} max max value
 *  @param {Boolean} notNull      not null
 *  @param {Object} defaultValue default value or nil
 *  @param {Boolean} primaryKey primary key
 *  @param {Boolean} autoincrement autoincrement
 */
export class UserCustomColumn extends UserColumn {
  constructor(
    index: number,
    name: string,
    dataType: GeoPackageDataType,
    max?: number,
    notNull?: boolean,
    defaultValue?: DBValue,
    primaryKey?: boolean,
    autoincrement?: boolean,
  ) {
    super(index, name, dataType, max, notNull, defaultValue, primaryKey, autoincrement);
    // eslint-disable-next-line eqeqeq
    if (dataType == null) {
      throw new Error('Data type is required to create column: ' + name);
    }
  }
  /**
   *  Create a new column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {GeoPackageDataType} type data type
   *  @param {Number} [max] max value
   *  @param {Boolean} [notNull]      not null
   *  @param {Object} [defaultValue] default value or nil
   *  @param {Object} [max] max value or nil
   *  @param {Boolean} [autoincrement] autoincrement or nil
   *
   *  @return {UserCustomColumn} created column
   */
  static createColumn(
    index: number,
    name: string,
    type: GeoPackageDataType,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
    autoincrement?: boolean,
  ): UserCustomColumn {
    return new UserCustomColumn(index, name, type, max, notNull, defaultValue, false, autoincrement);
  }

  /**
   * Create a new primary key column
   * @param index
   * @param name
   * @param autoincrement
   */
  static createPrimaryKeyColumn(
    index: number,
    name: string,
    autoincrement: boolean = UserTableDefaults.DEFAULT_AUTOINCREMENT,
  ): UserCustomColumn {
    return new UserCustomColumn(index, name, GeoPackageDataType.INTEGER, undefined, undefined, undefined, true, autoincrement);
  }
}
