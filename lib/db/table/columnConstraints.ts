/**
 * Column Constraints
 */
import { Constraint } from './constraint';

export class ColumnConstraints {
  /**
   * Column constraints
   */
  constraints: Constraint[] = [];

  /**
   * Constructor
   * @param name column name
   */
  constructor(public name: string) {}

  /**
   * Add a constraint
   * @param constraint constraint
   */
  addConstraint(constraint: Constraint) {
    this.constraints.push(constraint);
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addConstraints(constraints: Constraint[]) {
    this.constraints.push(...constraints);
  }

  /**
   * Get the constraints
   * @return constraints
   */
  getConstraints(): Constraint[] {
    return this.constraints;
  }

  /**
   * Get the constraint at the index
   * @param index constraint index
   * @return constraint
   */
  getConstraint(index: number): Constraint {
    if (index >= this.constraints.length) {
      return null;
    }
    return this.constraints[index];
  }

  /**
   * Get the number of constraints
   * @return constraints count
   */
  public numConstraints(): number {
    return this.constraints.length;
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addColumnConstraints(constraints: ColumnConstraints) {
    if (constraints !== null && constraints !== undefined) {
      this.addConstraints(constraints.getConstraints());
    }
  }

  /**
   * Check if there are constraints
   * @return true if has constraints
   */
  hasConstraints(): boolean {
    return this.constraints.length !== 0;
  }

}
