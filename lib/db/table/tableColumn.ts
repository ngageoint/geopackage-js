import { GeoPackageDataType } from '../geoPackageDataType';

/**
 * Table raw or unparsed constraint
 */
export class TableColumn {

  /**
   * Column index
   */
  index: number;

  /**
   * Column name
   */
  name: string;

  /**
   * Column type
   */
  type: string;

  /**
   * Column data type
   */
  dataType: GeoPackageDataType;

  /**
   * Column max value
   */
  max: number;

  /**
   * Column not null flag
   */
  notNull: boolean;

  /**
   * Default value as a string
   */
  defaultValueString: string;

  /**
   * Default value
   */
  defaultValue: any;

  /**
   * Primary key flag
   */
  primaryKey: boolean;

  /**
   * Autoincrement flag
   */
  autoincrement: boolean;

  /**
   * Constructor
   *
   * @param index column index
   * @param name column name
   * @param type column type
   * @param dataType column data type
   * @param max max value
   * @param notNull not null flag
   * @param defaultValueString default value as a string
   * @param defaultValue default value
   * @param primaryKey primary key flag
   * @param autoincrement autoincrement flag
   */
  constructor(index: number, name: string, type: string, dataType: GeoPackageDataType, max: number, notNull: boolean, defaultValueString: string, defaultValue: any, primaryKey: boolean, autoincrement: boolean) {
    this.index = index;
    this.name = name;
    this.type = type;
    this.dataType = dataType;
    this.max = max;
    this.notNull = notNull;
    this.defaultValueString = defaultValueString;
    this.defaultValue = defaultValue;
    this.primaryKey = primaryKey;
    this.autoincrement = autoincrement
  }

  /**
   * Get the column index
   *
   * @return column index
   */
  getIndex(): number {
    return this.index;
  }

  /**
   * Get the column name
   *
   * @return column name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the column type
   *
   * @return column type
   */
  getType(): string {
    return this.type;
  }

  /**
   * Get the column data type
   *
   * @return column data type, may be null
   */
  getDataType(): GeoPackageDataType {
    return this.dataType;
  }

  /**
   * Is the column the data type
   * @param dataType data type
   * @return true if the data type
   */
  isDataType(dataType: GeoPackageDataType): boolean {
    return this.dataType === dataType;
  }

  /**
   * Get the column max value
   * @return max value or null if no max
   */
  getMax(): number {
    return this.max;
  }

  /**
   * Is this a not null column?
   * @return true if not nullable
   */
  isNotNull(): boolean {
    return this.notNull;
  }

  /**
   * Get the default value as a string
   * @return default value as a string
   */
  getDefaultValueString(): string {
    return this.defaultValueString;
  }

  /**
   * Get the default value
   * @return default value
   */
  getDefaultValue(): any {
    return this.defaultValue;
  }

  /**
   * Is this a primary key column?
   * @return true if primary key column
   */
  isPrimaryKey(): boolean {
    return this.primaryKey;
  }

  /**
   * Is this an autoincrement column?
   * @return true if an autoincrement column
   */
  isAutoIncrement(): boolean {
    return this.autoincrement;
  }
}
