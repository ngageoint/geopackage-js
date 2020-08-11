/**
 * Table Constraints including column constraint
 */
import { ColumnConstraints } from './columnConstraints';
import { Constraint } from './constraint';

export class TableConstraints {

  /**
   * Table constraints
   */
  public constraints = [];

  /**
   * Column constraints
   */
  private columnConstraints:Map<string, ColumnConstraints> = new Map<string, ColumnConstraints>();

  /**
   * Add a table constraint
   * @param constraint constraint
   */
  addTableConstraint(constraint: Constraint) {
    this.constraints.push(constraint);
  }

  /**
   * Add table constraints
   * @param constraints constraints
   */
  addTableConstraints(constraints: Constraint[]) {
    this.constraints.push(...constraints);
  }

  /**
   * Get the table constraints
   * @return table constraints
   */
  getTableConstraints(): Constraint[] {
    return this.constraints;
  }

  /**
   * Get the table constraint at the index
   * @param index constraint index
   * @return table constraint
   */
  getTableConstraint(index: number): Constraint {
    if (index >= this.constraints.length) {
      return null;
    }
    return this.constraints[index];
  }

  /**
   * Get the number of table constraints
   * @return table constraints count
   */
  numTableConstraints(): number {
    return this.constraints.length;
  }

  /**
   * Add a column constraint
   * @param columnName column name
   * @param constraint constraint
   */
  addColumnConstraint(columnName: string, constraint: Constraint) {
    this.getOrCreateColumnConstraints(columnName).addConstraint(constraint);
  }

  /**
   * Add column constraints
   * @param columnName column name
   * @param constraints constraints
   */
  addConstraints(columnName: string, constraints: Constraint[]) {
    this.getOrCreateColumnConstraints(columnName).addConstraints(constraints);
  }

  /**
   * Add column constraints
   * @param constraints constraints
   */
  addColumnConstraints(constraints: ColumnConstraints) {
    this.getOrCreateColumnConstraints(constraints.name).addColumnConstraints(constraints);
  }

  /**
   * Get or create the column constraints for the column name
   * @param columnName column name
   * @return column constraints
   */
  getOrCreateColumnConstraints(columnName: string): ColumnConstraints {
    let constraints = this.columnConstraints.get(columnName);
    if (constraints == null) {
      constraints = new ColumnConstraints(columnName);
      this.columnConstraints.set(columnName, constraints);
    }
    return constraints;
  }

  /**
   * Add column constraints
   * @param constraints column constraints
   */
  addColumnConstraintsMap(constraints: Map<string, ColumnConstraints>) {
    constraints.forEach((columnConstraints) => {
      this.addColumnConstraints(columnConstraints);
    })
  }

  /**
   * Get the column constraints
   * @return column constraints
   */
  getColumnConstraintsMap(): Map<string, ColumnConstraints>  {
    return this.columnConstraints;
  }

  /**
   * Get the column names with constraints
   * @return column names
   */
  getColumnsWithConstraints(): string[] {
    return Array.from(this.columnConstraints.keys());
  }

  /**
   * Get the column constraints
   * @param columnName column name
   * @return constraints
   */
  getColumnConstraints(columnName: string): ColumnConstraints {
    return this.columnConstraints.get(columnName);
  }

  /**
   * Get the column constraint at the index
   * @param columnName column name
   * @param index constraint index
   * @return column constraint
   */
  getColumnConstraint(columnName: string, index: number): Constraint {
    let constraint = null;
    let columnConstraints = this.getColumnConstraints(columnName);
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
  addAllConstraints(constraints: TableConstraints) {
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
    return this.constraints.length > 0;
  }

  /**
   * Check if there are column constraints
   * @return true if has column constraints
   */
  hasColumnConstraints(): boolean {
    return this.columnConstraints.size > 0;
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
