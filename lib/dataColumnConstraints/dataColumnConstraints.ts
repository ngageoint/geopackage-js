
/**
 * Contains data to specify restrictions on basic data type column values
 * @class DataColumnConstraints
 */
export class DataColumnConstraints {
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
}
