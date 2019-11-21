
/**
 * Contains data to specify restrictions on basic data type column values
 * @class DataColumnConstraints
 */
class DataColumnConstraints {
  constructor() {
    /**
     * Case sensitive name of constraint
     * @member {string}
     */
    this.constraint_name = undefined;
    /**
     * Lowercase type name of constraint: range | enum | glob
     * @member {string}
     */
    this.constraint_type = undefined;
    /**
     * Specified case sensitive value for enum or glob or NULL for range constraint_type
     * @member {string}
     */
    this.value = undefined;
    /**
     * Minimum value for 'range' or NULL for 'enum' or 'glob' constraint_type
     * @member {Number}
     */
    this.min = undefined;
    /**
     * 0 (false) if min value is exclusive, or 1 (true) if min value is inclusive
     * @member {Number}
     */
    this.min_is_inclusive = undefined;
    /**
     * Maximum value for 'range' or NULL for 'enum' or 'glob' constraint_type
     * @member {Number}
     */
    this.max = undefined;
    /**
     * 0 (false) if max value is exclusive, or 1 (true) if max value is inclusive
     * @member {Number}
     */
    this.max_is_inclusive = undefined;
    /**
     * For ranges and globs, describes the constraing; for enums, describes the enum value.
     */
    this.description = undefined;
  }
}
module.exports = DataColumnConstraints;
