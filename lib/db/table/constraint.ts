import { ConstraintType } from './constraintType';
import { CoreSQLUtils } from '../coreSQLUtils';

export class Constraint {

  /**
   * Constraint keyword
   */
  static CONSTRAINT = 'CONSTRAINT';

  constructor(public type: ConstraintType, public name?: string, public order: number = Number.MAX_SAFE_INTEGER) {
  }

  /**
   * Build the name SQL
   *
   * @return name SQL
   */
  buildNameSql(): string {
    let sql = '';
    if (this.name !== null && this.name !== undefined) {
      sql = Constraint.CONSTRAINT + ' ' + CoreSQLUtils.quoteWrap(this.name) + ' ';
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

  compareTo(constraint: Constraint) {
    return this.getOrder(this.order) - this.getOrder(constraint.order) <= 0 ? -1 : 1;
  }

  private getOrder(order: number): number {
    return order !== null && order !== undefined ? order : Number.MAX_VALUE;
  }
}

