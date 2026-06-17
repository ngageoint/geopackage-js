/**
 * Column Constraints
 */
import { Constraint } from './constraint';
import { Constraints } from './constraints';

export class ColumnConstraints {
  /**
   * Column constraints
   */
  constraints: Constraints = new Constraints();

  /**
   * Constructor
   * @param name column name
   */
  constructor(public name: string) {}

  /**
   * Add a constraint
   * @param constraint constraint
   */
  addConstraint(constraint: Constraint): void {
    this.constraints.add(constraint);
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addConstraints(constraints: Constraints): void {
    this.constraints.addConstraints(constraints);
  }

  /**
   * Get the constraints
   * @return constraints
   */
  getConstraints(): Constraints {
    return this.constraints;
  }

  /**
   * Get the constraint at the index
   * @param index constraint index
   * @return constraint
   */
  getConstraint(index: number): Constraint {
    if (index >= this.constraints.size()) {
      return null;
    }
    return this.constraints.get(index);
  }

  /**
   * Get the number of constraints
   * @return constraints count
   */
  public numConstraints(): number {
    return this.constraints.size();
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addColumnConstraints(constraints: ColumnConstraints): void {
    if (constraints !== null && constraints !== undefined) {
      this.addConstraints(constraints.getConstraints());
    }
  }

  /**
   * Check if there are constraints
   * @return true if has constraints
   */
  hasConstraints(): boolean {
    return this.constraints.has();
  }
}
