/**
 * Column Value wrapper to specify additional value attributes, such as a range
 * tolerance for floating point numbers
 */
export class ColumnValue {
  /**
   * Value
   */
  private readonly value: any;

  /**
   * Value tolerance
   */
  private readonly tolerance: number;

  /**
   * Constructor
   *
   * @param value
   *            value
   * @param tolerance
   *            tolerance
   */
  public constructor(value: any, tolerance: number) {
    this.value = value;
    this.tolerance = tolerance;
  }

  /**
   * Get the value
   *
   * @return value
   */
  public getValue(): any {
    return this.value;
  }

  /**
   * Get the tolerance
   *
   * @return tolerance
   */
  public getTolerance(): number {
    return this.tolerance;
  }
}
