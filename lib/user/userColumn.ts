/**
 * @module user/userColumn
 */

import { DataTypes } from '../db/dataTypes';
import { DBValue } from '../db/dbAdapter';

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
export class UserColumn {
  min: number;
  constructor(
    public index: number,
    public name: string,
    public dataType: DataTypes,
    public max?: number,
    public notNull?: boolean,
    public defaultValue?: DBValue,
    public primaryKey?: boolean,
  ) {
    this.validateMax();
  }
  /**
   * Gets the type name
   * @return {module:db/dataTypes~GPKGDataType}
   */
  getTypeName(): string {
    let type = undefined;
    if (this.dataType !== DataTypes.GEOMETRY) {
      type = DataTypes.nameFromType(this.dataType);
    }
    return type;
  }
  /**
   * Validate that if max is set, the data type is text or blob
   */
  validateMax(): boolean {
    if (this.max && this.dataType !== DataTypes.TEXT && this.dataType !== DataTypes.BLOB) {
      throw new Error(
        'Column max is only supported for TEXT and BLOB columns. column: ' +
          this.name +
          ', max: ' +
          this.max +
          ', type: ' +
          this.dataType,
      );
    }
    return true;
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
    return new UserColumn(index, name, DataTypes.INTEGER, undefined, true, undefined, true);
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
  static createColumn(
    index: number,
    name: string,
    type: DataTypes,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
  ): UserColumn {
    return new UserColumn(index, name, type, max, notNull, defaultValue, false);
  }
}
