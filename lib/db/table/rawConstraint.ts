import { Constraint } from './constraint';
import { ConstraintType } from './constraintType';

/**
 * Table raw or unparsed constraint
 */
export class RawConstraint extends Constraint {

  /**
   * Constructor
   * @param type constraint type
   * @param name constraint name
   * @param sql constraint SQL
   */
  constructor(type: ConstraintType, name: string, public sql: string) {
    super(type, name);
  }

  buildSql(): string {
    let sql = this.sql;
    if (!sql.toUpperCase().startsWith(Constraint.CONSTRAINT)) {
      sql = this.buildNameSql() + sql;
    }
    return sql;
  }
}
