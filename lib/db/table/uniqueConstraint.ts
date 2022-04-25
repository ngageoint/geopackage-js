import { ConstraintType } from './constraintType';
import { UserColumn } from '../../user/userColumn';
import { Constraint } from './constraint';

/**
 * Table unique constraint for one or more columns
 */
export class UniqueConstraint extends Constraint {
  /**
   * Constraint keyword
   */
  static UNIQUE = 'UNIQUE';

  /**
   * Columns included in the unique constraint
   */
  columns: UserColumn[] = [];

  constructor(name?: string, ...columns: UserColumn[]) {
    super(ConstraintType.UNIQUE, name);
    this.add(...columns);
  }

  /**
   * {@inheritDoc}
   */
  buildSql(): string {
    let sql = '';
    sql = sql.concat(this.buildNameSql());
    sql = sql.concat(UniqueConstraint.UNIQUE);
    sql = sql.concat(' (');
    for (let i = 0; i < this.columns.length; i++) {
      const column = this.columns[i];
      if (i > 0) {
        sql = sql.concat(', ');
      }
      sql = sql.concat(column.getName());
    }
    sql = sql.concat(')');
    return sql;
  }

  /**
   * {@inheritDoc}
   */
  public copy(): UniqueConstraint {
    return new UniqueConstraint(this.name, ...this.columns);
  }

  /**
   * Add columns
   * @param columns columns
   */
  add(...columns: UserColumn[]) {
    columns.forEach(column => {
      this.columns.push(column);
    });
  }

  /**
   * Get the columns
   *
   * @return columns
   */
  getColumns(): UserColumn[] {
    return this.columns;
  }

}
