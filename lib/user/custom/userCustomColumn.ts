/**
 * @module user/custom
 */

import { UserColumn } from '../userColumn';

/**
 * Create a new user custom columnd
 *  @param {Number} index        column index
 *  @param {string} name         column name
 *  @param {module:db/dataTypes~GPKGDataType} dataType  data type
 *  @param {Number} max max value
 *  @param {Boolean} notNull      not null
 *  @param {Object} defaultValue default value or nil
 *  @param {Boolean} primaryKey primary key
 */
export class UserCustomColumn extends UserColumn {
  constructor(
    index: number,
    name: string,
    dataType: any,
    max?: number,
    notNull?: boolean,
    defaultValue?: any,
    primaryKey?: boolean,
  ) {
    super(index, name, dataType, max, notNull, defaultValue, primaryKey);
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
   *  @param {module:db/dataTypes~GPKGDataType} dataType         data type
   *  @param {Number} [max] max value
   *  @param {Boolean} [notNull]      not null
   *  @param {Object} [defaultValue] default value or nil
   *
   *  @return {module:user/custom~UserCustomColumn} created column
   */
  static createColumn(
    index: number,
    name: string,
    dataType: any,
    max?: number,
    notNull?: boolean,
    defaultValue?: any,
  ): UserCustomColumn {
    return new UserCustomColumn(index, name, dataType, max, notNull, defaultValue, false);
  }
}
