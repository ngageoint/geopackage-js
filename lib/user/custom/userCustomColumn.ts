import { UserColumn } from '../userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { DBValue } from '../../db/dbValue';
import { UserTableDefaults } from '../userTableDefaults';
import { TableColumn } from '../../db/table/tableColumn';

/**
 * Create a new user custom columnd
 *  @param {Number} index        column index
 *  @param {string} name         column name
 *  @param {GeoPackageDataType} dataType  data type
 *  @param {Number} max max value
 *  @param {Boolean} notNull      not null
 *  @param {Object} defaultValue default value or nil
 *  @param {Boolean} primaryKey primary key
 *  @param {Boolean} autoincrement autoincrement
 */
export class UserCustomColumn extends UserColumn {
  /**
   *  Create a new column
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
    name: string,
    type: GeoPackageDataType,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
    autoincrement?: boolean,
  ): UserCustomColumn {
    return UserCustomColumn.createColumnWithIndex(
      UserCustomColumn.NO_INDEX,
      name,
      type,
      notNull,
      defaultValue,
      max,
      autoincrement,
    );
  }

  /**
   *  Create a new column with a specified column index
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
  static createColumnWithIndex(
    index: number = UserCustomColumn.NO_INDEX,
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
   * @param name
   * @param autoincrement
   */
  static createPrimaryKeyColumn(
    name: string,
    autoincrement: boolean = UserTableDefaults.DEFAULT_AUTOINCREMENT,
  ): UserCustomColumn {
    return UserCustomColumn.createPrimaryKeyColumnWithIndex(UserCustomColumn.NO_INDEX, name, autoincrement);
  }

  /**
   * Create a new primary key column with a specified column index
   * @param index
   * @param name
   * @param autoincrement
   */
  static createPrimaryKeyColumnWithIndex(
    index: number = UserCustomColumn.NO_INDEX,
    name: string,
    autoincrement: boolean = UserTableDefaults.DEFAULT_AUTOINCREMENT,
  ): UserCustomColumn {
    return new UserCustomColumn(
      index,
      name,
      GeoPackageDataType.INTEGER,
      undefined,
      true,
      undefined,
      true,
      autoincrement,
    );
  }

  /**
   * Create a new column
   * @param tableColumn table column
   * @return user custom column
   */
  public static createColumnWithTableColumn(tableColumn: TableColumn): UserCustomColumn {
    return new UserCustomColumn(tableColumn);
  }

  copy(): UserCustomColumn {
    return new UserCustomColumn(
      this.getIndex(),
      this.getName(),
      this.getDataType(),
      this.getMax(),
      this.isNotNull(),
      this.getDefaultValue(),
      this.isPrimaryKey(),
      this.isAutoincrement(),
    );
  }
}
