/**
 * @module user/custom
 */
import { UserColumn } from '../user/userColumn';
import { GeoPackageDataType } from '../db/geoPackageDataType';
import { DBValue } from '../db/dbAdapter';
import { UserTableDefaults } from '../user/userTableDefaults';

/**
 * Attribute Column
 */
export class AttributesColumn extends UserColumn {
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
  ): AttributesColumn {
    return new AttributesColumn(index, name, type, max, notNull, defaultValue, false, autoincrement);
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
  ): AttributesColumn {
    return new AttributesColumn(
      index,
      name,
      GeoPackageDataType.INTEGER,
      undefined,
      undefined,
      undefined,
      true,
      autoincrement,
    );
  }

  copy(): AttributesColumn {
    return new AttributesColumn(
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
