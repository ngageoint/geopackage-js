import { ConstraintType } from './constraintType';
import { StringUtils } from '../stringUtils';
import { Comparable } from '@ngageoint/simple-features-js';

export class Constraint implements Comparable<Constraint> {
  /**
   * Constraint keyword
   */
  static CONSTRAINT = 'CONSTRAINT';

  constructor(public type: ConstraintType, public name?: string, public order: number = Number.MAX_SAFE_INTEGER) {}

  /**
   * Build the name SQL
   *
   * @return name SQL
   */
  buildNameSql(): string {
    let sql = '';
    if (this.name !== null && this.name !== undefined) {
      sql = Constraint.CONSTRAINT + ' ' + StringUtils.quoteWrap(this.name) + ' ';
    }
    return sql;
  }

  /**
   * Builds the sql
   */
  buildSql(): string {
    return '';
  }

  copy(): Constraint {
    return new Constraint(this.type, this.name);
  }

  getName(): string {
    return this.name;
  }

  getType(): ConstraintType {
    return this.type;
  }

  setOrder(order: number): void {
    this.order = order;
  }

  compareTo(constraint: Constraint): number {
    return this.getOrder(this.order) - this.getOrder(constraint.order) <= 0 ? -1 : 1;
  }

  public getOrder(order: number): number {
    return order !== null && order !== undefined ? order : Number.MAX_VALUE;
  }
}
