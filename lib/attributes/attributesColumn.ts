/**
 * @module user/custom
 */
import { UserColumn } from '../user/userColumn';
import { GeoPackageDataType } from '../db/geoPackageDataType';
import { DBValue } from '../db/dbValue';
import { UserTableDefaults } from '../user/userTableDefaults';
import { TableColumn } from '../db/table/tableColumn';

/**
 * Attribute Column
 */
export class AttributesColumn extends UserColumn {
  /**
   * Constructor
   * @param index column index
   * @param name column name
   * @param dataType data type
   * @param max  max value
   * @param notNull not null flag
   * @param defaultValue default value
   * @param primaryKey primary key flag
   * @param autoincrement autoincrement flag
   */
  public constructor(
    index: number,
    name: string,
    dataType: GeoPackageDataType,
    max: number,
    notNull: boolean,
    defaultValue: any,
    primaryKey: boolean,
    autoincrement: boolean,
  );

  /**
   * Constructor
   * @param index column index
   * @param name column name
   * @param type string type
   * @param dataType data type
   * @param max max value
   * @param notNull not null flag
   * @param defaultValue default value
   * @param primaryKey primary key flag
   * @param autoincrement autoincrement flag
   */
  public constructor(
    index: number,
    name: string,
    type: string,
    dataType: GeoPackageDataType,
    max: number,
    notNull: boolean,
    defaultValue: any,
    primaryKey: boolean,
    autoincrement: boolean,
  );

  /**
   * Constructor
   *
   * @param tableColumn
   *            table column
   */
  public constructor(tableColumn: TableColumn);
  public constructor(userColumn: UserColumn);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof TableColumn) {
        super(args[0]);
      } else if (args[0] instanceof UserColumn) {
        super(args[0]);
      }
    } else if (args.length === 8) {
      super(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
    } else if (args.length === 9) {
      super(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
    }
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
