/**
 * DataColumnConstraintsKey complex primary key
 */
export class DataColumnConstraintsKey {
  private constraint_name: string;

  private constraint_type: string;

  private value: string;

  /**
   * Constructor
   * @param constraintName
   * @param constraintType
   * @param value
   */
  public constructor(constraintName: string, constraintType: string, value: string) {
    this.constraint_name = constraintName;
    this.constraint_type = constraintType;
    this.value = value;
  }

  /**
   * Set constraint name
   * @param constraintName
   */
  public setConstraintName(constraintName: string): void {
    this.constraint_name = constraintName;
  }

  /**
   * Get constraint name
   */
  public getConstraintName(): string {
    return this.constraint_name;
  }

  /**
   * Set constraint type
   * @param constraintType
   */
  public setConstraintType(constraintType: string): void {
    this.constraint_type = constraintType;
  }

  /**
   * Get constraint type
   */
  public getConstraintType(): string {
    return this.constraint_type;
  }

  /**
   * Set column value
   * @param value
   */
  public setValue(value: string): void {
    this.value = value;
  }

  /**
   * Get column value
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * {@inheritDoc}
   */
  public toString(): string {
    return this.constraint_name + ':' + this.constraint_type + ':' + this.value;
  }

  /**
   * {@inheritDoc}
   */
  public equals(obj: DataColumnConstraintsKey): boolean {
    return this.getConstraintType() === obj.getConstraintName() && this.getConstraintType() === obj.getConstraintType() && this.getValue() === obj.getValue();
  }
}
