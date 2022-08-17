import sortedIndex from 'lodash/sortedIndex';
import { ConstraintType } from './constraintType';
import { Constraint } from './constraint';

export class Constraints {
  /**
   * Constraints
   */
  constraints = [];

  /**
   * Type Constraints
   */
  typedConstraints = {};

  /**
   * Constructor
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  /**
   * Add constraint
   * @param constraint constraint
   */
  add(constraint: Constraint): void {
    const orders = this.constraints.map(c => c.order);

    const lastIndex = orders.lastIndexOf(constraint.order);
    let insertLocation = lastIndex + 1;
    if (lastIndex === -1) {
      insertLocation = sortedIndex(
        this.constraints.map(c => c.order),
        constraint.order,
      );
    }

    if (insertLocation === this.constraints.length) {
      this.constraints.push(constraint);
    } else {
      this.constraints.splice(insertLocation, 0, constraint);
    }
    if (
      this.typedConstraints[constraint.getType()] === null ||
      this.typedConstraints[constraint.getType()] === undefined
    ) {
      this.typedConstraints[constraint.getType()] = [];
    }
    this.typedConstraints[constraint.getType()].push(constraint);
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addConstraintArray(constraints: Constraint[]): void {
    for (let i = 0; i < constraints.length; i++) {
      this.add(constraints[i]);
    }
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addConstraints(constraints: Constraints): void {
    this.addConstraintArray(constraints.all());
  }

  /**
   * Check if has constraints
   * @return true if has constraints
   */
  has(): boolean {
    return this.constraints.length > 0;
  }

  /**
   * Check if has constraints of the provided type
   * @param type constraint type
   * @return true if has constraints
   */
  hasType(type: ConstraintType): boolean {
    return this.getConstraintsForType(type).length !== 0;
  }

  /**
   * Get the constraints
   * @return constraints
   */
  all(): Constraint[] {
    return this.constraints;
  }

  /**
   * Get the constraint at the index
   * @param index constraint index
   * @return constraint
   */
  get(index: number): Constraint {
    return this.constraints[index];
  }

  /**
   * Get the constraints of the provided type
   * @param type constraint type
   * @return constraints
   */
  getConstraintsForType(type: ConstraintType): Constraint[] {
    let constraints = this.typedConstraints[type];
    if (constraints === null || constraints === undefined) {
      constraints = [];
    }
    return constraints;
  }

  /**
   * Clear the constraints
   * @return cleared constraints
   */
  clear(): Constraint[] {
    const constraintsCopy = this.constraints.slice();
    this.constraints = [];
    this.typedConstraints = {};
    return constraintsCopy;
  }

  /**
   * Clear the constraints of the provided type
   *
   * @param type
   *            constraint type
   * @return cleared constraints
   */
  clearConstraintsByType(type: ConstraintType): Constraint[] {
    let typedConstraints = this.typedConstraints[type];
    delete this.typedConstraints[type];
    if (typedConstraints === null) {
      typedConstraints = [];
    } else if (typedConstraints.length === 0) {
      this.constraints = this.constraints.filter(c => c.getType() !== type);
    }
    return typedConstraints;
  }

  /**
   * Copy the constraints
   * @return constraints
   */
  copy(): Constraints {
    const constraints = new Constraints();
    constraints.addConstraints(this);
    return constraints;
  }

  size(): number {
    return this.constraints.length;
  }
}
