/**
 * Table Constraints including column constraint
 */
import { ColumnConstraints } from './columnConstraints';
import { Constraint } from './constraint';
import { Constraints } from './constraints';

export class TableConstraints {
  /**
   * Table constraints
   */
  public constraints: Constraints = new Constraints();

  /**
   * Column constraints
   */
  private columnConstraints = {};

  /**
   * Add a table constraint
   * @param constraint constraint
   */
  addTableConstraint(constraint: Constraint): void {
    this.constraints.add(constraint);
  }

  /**
   * Add table constraints
   * @param constraints constraints
   */
  addTableConstraints(constraints: Constraints): void {
    this.constraints.addConstraints(constraints);
  }

  /**
   * Get the table constraints
   * @return table constraints
   */
  getTableConstraints(): Constraints {
    return this.constraints;
  }

  /**
   * Get the table constraint at the index
   * @param index constraint index
   * @return table constraint
   */
  getTableConstraint(index: number): Constraint {
    if (index >= this.constraints.size()) {
      return null;
    }
    return this.constraints.get(index);
  }

  /**
   * Get the number of table constraints
   * @return table constraints count
   */
  numTableConstraints(): number {
    return this.constraints.size();
  }

  /**
   * Add a column constraint
   * @param columnName column name
   * @param constraint constraint
   */
  addColumnConstraint(columnName: string, constraint: Constraint): void {
    this.getOrCreateColumnConstraints(columnName).addConstraint(constraint);
  }

  /**
   * Add column constraints
   * @param columnName column name
   * @param constraints constraints
   */
  addConstraints(columnName: string, constraints: Constraints): void {
    this.getOrCreateColumnConstraints(columnName).addConstraints(constraints);
  }

  /**
   * Add column constraints
   * @param constraints constraints
   */
  addColumnConstraints(constraints: ColumnConstraints): void {
    this.getOrCreateColumnConstraints(constraints.name).addColumnConstraints(constraints);
  }

  /**
   * Get or create the column constraints for the column name
   * @param columnName column name
   * @return column constraints
   */
  getOrCreateColumnConstraints(columnName: string): ColumnConstraints {
    let constraints = this.columnConstraints[columnName];
    if (constraints === null || constraints === undefined) {
      constraints = new ColumnConstraints(columnName);
      this.columnConstraints[columnName] = constraints;
    }
    return constraints;
  }

  /**
   * Add column constraints
   * @param constraints column constraints
   */
  addColumnConstraintsMap(constraints: Map<string, ColumnConstraints>): void {
    constraints.forEach((columnConstraints) => {
      this.addColumnConstraints(columnConstraints);
    });
  }

  /**
   * Get the column constraints
   * @return column constraints
   */
  getColumnConstraintsMap(): any {
    return this.columnConstraints;
  }

  /**
   * Get the column names with constraints
   * @return column names
   */
  getColumnsWithConstraints(): string[] {
    return Array.from(Object.keys(this.columnConstraints));
  }

  /**
   * Get the column constraints
   * @param columnName column name
   * @return constraints
   */
  getColumnConstraints(columnName: string): ColumnConstraints {
    return this.columnConstraints[columnName];
  }

  /**
   * Get the column constraint at the index
   * @param columnName column name
   * @param index constraint index
   * @return column constraint
   */
  getColumnConstraint(columnName: string, index: number): Constraint {
    let constraint = null;
    const columnConstraints = this.getColumnConstraints(columnName);
    if (columnConstraints !== null && columnConstraints !== undefined) {
      constraint = columnConstraints.getConstraint(index);
    }
    return constraint;
  }

  /**
   * Get the number of column constraints for the column name
   * @param columnName column name
   * @return column constraints count
   */
  numColumnConstraints(columnName: string): number {
    let count = 0;
    const columnConstraints = this.getColumnConstraints(columnName);
    if (columnConstraints !== null && columnConstraints !== undefined) {
      count = columnConstraints.numConstraints();
    }
    return count;
  }

  /**
   * Add table constraints
   * @param constraints table constraints
   */
  addAllConstraints(constraints: TableConstraints): void {
    if (constraints != null) {
      this.addTableConstraints(constraints.getTableConstraints());
      this.addColumnConstraintsMap(constraints.getColumnConstraintsMap());
    }
  }

  /**
   * Check if there are constraints
   * @return true if has constraints
   */
  hasConstraints(): boolean {
    return this.hasTableConstraints() || this.hasColumnConstraints();
  }

  /**
   * Check if there are table constraints
   * @return true if has table constraints
   */
  hasTableConstraints(): boolean {
    return this.constraints.has();
  }

  /**
   * Check if there are column constraints
   * @return true if has column constraints
   */
  hasColumnConstraints(): boolean {
    return Object.keys(this.columnConstraints).length > 0;
  }

  /**
   * Check if there are column constraints for the column name
   * @param columnName column name
   * @return true if has column constraints
   */
  hasColumnConstraintsForColumn(columnName: string): boolean {
    return this.numColumnConstraints(columnName) > 0;
  }
}
