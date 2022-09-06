import { DataColumnConstraintType } from './dataColumnConstraintType';
import { GeoPackageException } from '../../../geoPackageException';
import { DataColumnConstraintsKey } from './dataColumnConstraintsKey';
import type { DataColumnsDao } from '../columns/dataColumnsDao';
import type { DataColumns } from '../columns/dataColumns';

/**
 * Contains data to specify restrictions on basic data type column values
 * @class DataColumnConstraints
 */
export class DataColumnConstraints {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'gpkg_data_column_constraints';

  /**
   * constraintName field name
   */
  public static readonly COLUMN_CONSTRAINT_NAME = 'constraint_name';

  /**
   * constraintType field name
   */
  public static readonly COLUMN_CONSTRAINT_TYPE = 'constraint_type';

  /**
   * value field name
   */
  public static readonly COLUMN_VALUE = 'value';

  /**
   * min field name
   */
  public static readonly COLUMN_MIN = 'min';

  /**
   * minIsInclusive field name
   */
  public static readonly COLUMN_MIN_IS_INCLUSIVE = 'min_is_inclusive';

  /**
   * max field name
   */
  public static readonly COLUMN_MAX = 'max';

  /**
   * maxIsInclusive field name
   */
  public static readonly COLUMN_MAX_IS_INCLUSIVE = 'max_is_inclusive';

  /**
   * description field name
   */
  public static readonly COLUMN_DESCRIPTION = 'description';

  /**
   * Case sensitive name of constraint
   * @member {string}
   */
  constraint_name: string;
  /**
   * Lowercase type name of constraint: range | enum | glob
   * @member {string}
   */
  constraint_type: string;
  /**
   * Specified case sensitive value for enum or glob or NULL for range constraint_type
   * @member {string}
   */
  value: string;
  /**
   * Minimum value for 'range' or NULL for 'enum' or 'glob' constraint_type
   * @member {Number}
   */
  min: number;
  /**
   * 0 (false) if min value is exclusive, or 1 (true) if min value is inclusive
   * @member {Number}
   */
  min_is_inclusive: boolean;
  /**
   * Maximum value for 'range' or NULL for 'enum' or 'glob' constraint_type
   * @member {Number}
   */
  max: number;
  /**
   * 0 (false) if max value is exclusive, or 1 (true) if max value is inclusive
   */
  max_is_inclusive: boolean;
  /**
   * For ranges and globs, describes the constraing; for enums, describes the enum value.
   */
  description: string;

  /**
   * Default Constructor
   */
  public constructor();

  /**
   * Copy Constructor
   *
   * @param dataColumnConstraints  data column constraints to copy
   */
  public constructor(dataColumnConstraints: DataColumnConstraints);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof DataColumnConstraints) {
      const dataColumnConstraints = args[0];
      this.constraint_name = dataColumnConstraints.constraint_name;
      this.constraint_type = dataColumnConstraints.constraint_type;
      this.value = dataColumnConstraints.value;
      this.min = dataColumnConstraints.min;
      this.min_is_inclusive = dataColumnConstraints.min_is_inclusive;
      this.max = dataColumnConstraints.max;
      this.max_is_inclusive = dataColumnConstraints.max_is_inclusive;
      this.description = dataColumnConstraints.description;
    }
  }

  /**
   * Get the id
   *
   * @return DataColumnConstraintsKey
   */
  public getId(): DataColumnConstraintsKey {
    return new DataColumnConstraintsKey(this.constraint_type, this.constraint_type, this.value);
  }

  public getConstraintName(): string {
    return this.constraint_name;
  }

  public setConstraintName(constraintName: string): void {
    this.constraint_name = constraintName;
  }

  public getConstraintType(): DataColumnConstraintType {
    return DataColumnConstraintType.fromName(this.constraint_type);
  }

  public setConstraintTypeFromString(constraintType: string): void {
    this.setConstraintType(DataColumnConstraintType.fromName(constraintType));
  }

  public setConstraintType(constraintType: DataColumnConstraintType): void {
    this.constraint_type = DataColumnConstraintType.nameFromType(constraintType);
    switch (constraintType) {
      case DataColumnConstraintType.RANGE:
        this.setValue(null);
        break;
      case DataColumnConstraintType.ENUM:
      case DataColumnConstraintType.GLOB:
        this.setMin(null);
        this.setMax(null);
        this.setMinIsInclusive(null);
        this.setMaxIsInclusive(null);
        break;
      default:
    }
  }

  public getValue(): string {
    return this.value;
  }

  public setValue(value: string): void {
    if (this.constraint_type != null && value != null && this.getConstraintType() === DataColumnConstraintType.RANGE) {
      throw new GeoPackageException('The value must be null for ' + DataColumnConstraintType.RANGE + ' constraints');
    }
    this.value = value;
  }

  public getMin(): number {
    return this.min;
  }

  public setMin(min: number): void {
    this.validateRangeValue(DataColumnConstraints.COLUMN_MIN, min);
    this.min = min;
  }

  public getMinIsInclusive(): boolean {
    return this.min_is_inclusive;
  }

  public setMinIsInclusive(minIsInclusive: boolean): void {
    this.validateRangeValue(DataColumnConstraints.COLUMN_MIN_IS_INCLUSIVE, minIsInclusive);
    this.min_is_inclusive = minIsInclusive;
  }

  public getMax(): number {
    return this.max;
  }

  public setMax(max: number): void {
    this.validateRangeValue(DataColumnConstraints.COLUMN_MAX, max);
    this.max = max;
  }

  public getMaxIsInclusive(): boolean {
    return this.max_is_inclusive;
  }

  public setMaxIsInclusive(maxIsInclusive: boolean): void {
    this.validateRangeValue(DataColumnConstraints.COLUMN_MAX_IS_INCLUSIVE, maxIsInclusive);
    this.max_is_inclusive = maxIsInclusive;
  }

  public getDescription(): string {
    return this.description;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public getColumns(dao: DataColumnsDao): DataColumns[] {
    let columns = null;
    if (this.constraint_name != null) {
      columns = dao.queryByConstraintName(this.constraint_name);
    }
    return columns;
  }

  /**
   * Validate the constraint type when a range value is set
   *
   * @param column
   * @param value
   */
  private validateRangeValue(column: string, value: any): void {
    if (this.constraint_type != null && value != null && this.getConstraintType() !== DataColumnConstraintType.RANGE) {
      throw new GeoPackageException(
        'The ' +
          column +
          ' must be null for ' +
          DataColumnConstraintType.ENUM +
          ' and ' +
          DataColumnConstraintType.GLOB +
          ' constraints',
      );
    }
  }
}
