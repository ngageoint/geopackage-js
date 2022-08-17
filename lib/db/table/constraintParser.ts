/**
 * SQL constraint parser from create table statements
 */
import { TableConstraints } from './tableConstraints';
import { ColumnConstraints } from './columnConstraints';
import { Constraint } from './constraint';
import { ConstraintType } from './constraintType';
import { RawConstraint } from './rawConstraint';
import { StringUtils } from '../stringUtils';

export class ConstraintParser {
  /**
   * Constraint name pattern
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  static NAME_PATTERN = (s: string) => s.match(/CONSTRAINT\s+("[\s\S]+"|\S+)\s/i);

  /**
   * Constraint name pattern name matcher group
   */
  static NAME_PATTERN_NAME_GROUP = 1;

  /**
   * Constraint name and definition pattern
   */
  static CONSTRAINT_PATTERN = (s: string): string[] => s.match(/(CONSTRAINT\s+("[\s\S]+"|\S+)\s)?([\s\S]*)/i);

  /**
   * Constraint name and definition pattern name matcher group
   */
  static CONSTRAINT_PATTERN_NAME_GROUP = 2;

  /**
   * Constraint name and definition pattern definition matcher group
   */
  static CONSTRAINT_PATTERN_DEFINITION_GROUP = 3;

  /**
   * Get the constraints for the table SQL
   * @param tableSql table SQL
   * @return constraints
   */
  static getConstraints(tableSql: string): TableConstraints {
    const constraints = new TableConstraints();
    // Find the start and end of the column definitions and table
    // constraints
    let start = -1;
    let end = -1;

    if (tableSql !== null && tableSql !== undefined) {
      start = tableSql.indexOf('(');
      end = tableSql.lastIndexOf(')');
    }

    if (start >= 0 && end >= 0) {
      const definitions = tableSql.substring(start + 1, end).trim();

      // Parse the column definitions and table constraints, divided by
      // columns when not within parentheses. Create constraints when
      // found.
      let openParentheses = 0;
      let sqlStart = 0;

      for (let i = 0; i < definitions.length; i++) {
        const character = definitions.charAt(i);
        if (character === '(') {
          openParentheses++;
        } else if (character === ')') {
          openParentheses--;
        } else if (character === ',' && openParentheses === 0) {
          const constraintSql = definitions.substring(sqlStart, i);
          ConstraintParser.addConstraints(constraints, constraintSql);
          sqlStart = i + 1;
        }
      }
      if (sqlStart < definitions.length) {
        const constraintSql = definitions.substring(sqlStart, definitions.length);
        ConstraintParser.addConstraints(constraints, constraintSql);
      }
    }

    return constraints;
  }

  /**
   * Add constraints of the optional type or all constraints
   * @param constraints constraints to add to
   * @param constraintSql constraint SQL statement
   */
  static addConstraints(constraints: TableConstraints, constraintSql: string): void {
    const constraint = ConstraintParser.getTableConstraint(constraintSql);
    if (constraint !== null && constraint !== undefined) {
      constraints.addTableConstraint(constraint);
    } else {
      const columnConstraints = ConstraintParser.getColumnConstraints(constraintSql);
      if (columnConstraints.hasConstraints()) {
        constraints.addColumnConstraints(columnConstraints);
      }
    }
  }

  /**
   * Attempt to get column constraints by parsing the SQL statement
   * @param constraintSql constraint SQL statement
   * @return constraints
   */
  static getColumnConstraints(constraintSql: string): ColumnConstraints {
    const parts = constraintSql.trim().split(/\s+/);
    const columnName = StringUtils.quoteUnwrap(parts[0]);

    const constraints = new ColumnConstraints(columnName);

    let constraintIndex = -1;
    let constraintType = null;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (Constraint.CONSTRAINT === part.toUpperCase()) {
        if (constraintType !== null && constraintType !== undefined) {
          constraints.addConstraint(ConstraintParser.createConstraint(parts, constraintIndex, i, constraintType));
          constraintType = null;
        }
        constraintIndex = i;
      } else {
        const type = ConstraintType.getColumnType(part);
        if (type !== null && type !== undefined) {
          if (constraintType !== null && constraintType !== undefined) {
            constraints.addConstraint(ConstraintParser.createConstraint(parts, constraintIndex, i, constraintType));
            constraintIndex = -1;
          }
          if (constraintIndex < 0) {
            constraintIndex = i;
          }
          constraintType = type;
        }
      }
    }
    if (constraintType !== null && constraintType !== undefined) {
      constraints.addConstraint(
        ConstraintParser.createConstraint(parts, constraintIndex, parts.length, constraintType),
      );
    }
    return constraints;
  }

  /**
   * Create a constraint from the SQL parts with the range for the type
   * @param parts SQL parts
   * @param startIndex start index (inclusive)
   * @param endIndex end index (exclusive)
   * @param type constraint type
   * @return constraint
   */
  static createConstraint(parts: string[], startIndex: number, endIndex: number, type: ConstraintType): Constraint {
    let constraintSql = '';
    for (let i = startIndex; i < endIndex; i++) {
      if (constraintSql.length > 0) {
        constraintSql = constraintSql.concat(' ');
      }
      constraintSql = constraintSql.concat(parts[i]);
    }
    const name = ConstraintParser.getName(constraintSql);
    return new RawConstraint(type, name, constraintSql);
  }

  /**
   * Attempt to get the constraint by parsing the SQL statement
   * @param constraintSql constraint SQL statement
   * @param table true to search for a table constraint, false to search for a column constraint
   * @return constraint or null
   */
  static getConstraint(constraintSql: string, table: boolean): Constraint {
    let constraint = null;
    const nameAndDefinition = ConstraintParser.getNameAndDefinition(constraintSql);
    const definition = nameAndDefinition[1];
    if (definition !== null && definition !== undefined) {
      const prefix = definition.split(/\s+/)[0];
      let type;
      if (table) {
        type = ConstraintType.getTableType(prefix);
      } else {
        type = ConstraintType.getColumnType(prefix);
      }
      if (type !== null && type !== undefined) {
        constraint = new RawConstraint(type, nameAndDefinition[0], constraintSql.trim());
      }
    }
    return constraint;
  }

  /**
   * Attempt to get a table constraint by parsing the SQL statement
   * @param constraintSql constraint SQL statement
   * @return constraint or null
   */
  static getTableConstraint(constraintSql: string): Constraint {
    return ConstraintParser.getConstraint(constraintSql, true);
  }

  /**
   * Check if the SQL is a table type constraint
   * @param constraintSql constraint SQL statement
   * @return true if a table constraint
   */
  static isTableConstraint(constraintSql: string): boolean {
    return ConstraintParser.getTableConstraint(constraintSql) !== null;
  }

  /**
   * Get the table constraint type of the constraint SQL
   * @param constraintSql constraint SQL
   * @return constraint type or null
   */
  static getTableType(constraintSql: string): ConstraintType {
    let type = null;
    const constraint = ConstraintParser.getTableConstraint(constraintSql);
    if (constraint != null) {
      type = constraint.type;
    }
    return type;
  }

  /**
   * Determine if the table constraint SQL is the constraint type
   * @param type constraint type
   * @param constraintSql constraint SQL
   * @return true if the constraint type
   */
  static isTableType(type: ConstraintType, constraintSql: string): boolean {
    let isType = false;
    const constraintType = ConstraintParser.getTableType(constraintSql);
    if (constraintType != null) {
      isType = type === constraintType;
    }
    return isType;
  }

  /**
   * Attempt to get a column constraint by parsing the SQL statement
   * @param constraintSql constraint SQL statement
   * @return constraint or null
   */
  static getColumnConstraint(constraintSql: string): Constraint {
    return ConstraintParser.getConstraint(constraintSql, false);
  }

  /**
   * Check if the SQL is a column type constraint
   * @param constraintSql constraint SQL statement
   * @return true if a column constraint
   */
  static isColumnConstraint(constraintSql: string): boolean {
    return ConstraintParser.getColumnConstraint(constraintSql) != null;
  }

  /**
   * Get the column constraint type of the constraint SQL
   * @param constraintSql constraint SQL
   * @return constraint type or null
   */
  static getColumnType(constraintSql: string): ConstraintType {
    let type = null;
    const constraint = ConstraintParser.getColumnConstraint(constraintSql);
    if (constraint != null) {
      type = constraint.type;
    }
    return type;
  }

  /**
   * Determine if the column constraint SQL is the constraint type
   * @param type constraint type
   * @param constraintSql constraint SQL
   * @return true if the constraint type
   */
  static isColumnType(type: ConstraintType, constraintSql: string): boolean {
    let isType = false;
    const constraintType = ConstraintParser.getColumnType(constraintSql);
    if (constraintType != null) {
      isType = type == constraintType;
    }
    return isType;
  }

  /**
   * Attempt to get a constraint by parsing the SQL statement
   * @param constraintSql constraint SQL statement
   * @return constraint or null
   */
  static getTableOrColumnConstraint(constraintSql: string): Constraint {
    let constraint = ConstraintParser.getTableConstraint(constraintSql);
    if (constraint === null || constraint === undefined) {
      constraint = ConstraintParser.getColumnConstraint(constraintSql);
    }
    return constraint;
  }

  /**
   * Check if the SQL is a constraint
   * @param constraintSql constraint SQL statement
   * @return true if a constraint
   */
  static isConstraint(constraintSql: string): boolean {
    return ConstraintParser.getTableOrColumnConstraint(constraintSql) !== null;
  }

  /**
   * Get the constraint type of the constraint SQL
   * @param constraintSql constraint SQL
   * @return constraint type or null
   */
  static getType(constraintSql: string): ConstraintType {
    let type = null;
    const constraint = ConstraintParser.getTableOrColumnConstraint(constraintSql);
    if (constraint !== null && constraint !== undefined) {
      type = constraint.getType();
    }
    return type;
  }

  /**
   * Determine if the constraint SQL is the constraint type
   * @param type constraint type
   * @param constraintSql constraint SQL
   * @return true if the constraint type
   */
  static isType(type: ConstraintType, constraintSql: string): boolean {
    let isType = false;
    const constraintType = ConstraintParser.getType(constraintSql);
    if (constraintType !== null && constraintType !== undefined) {
      isType = type === constraintType;
    }
    return isType;
  }

  /**
   * Get the constraint name if it has one
   * @param constraintSql constraint SQL
   * @return constraint name or null
   */
  static getName(constraintSql: string): string {
    let name = null;
    const matches = ConstraintParser.NAME_PATTERN(constraintSql);
    if (matches !== null && matches.length > ConstraintParser.NAME_PATTERN_NAME_GROUP) {
      name = StringUtils.quoteUnwrap(matches[ConstraintParser.NAME_PATTERN_NAME_GROUP]);
    }
    return name;
  }

  /**
   * Get the constraint name and remaining definition
   * @param constraintSql constraint SQL
   * @return array with name or null at index 0, definition at index 1
   */
  static getNameAndDefinition(constraintSql: string): string[] {
    let parts = [null, constraintSql];
    const matches = ConstraintParser.CONSTRAINT_PATTERN(constraintSql.trim());
    if (matches !== null && matches.length > ConstraintParser.CONSTRAINT_PATTERN_DEFINITION_GROUP) {
      let name = StringUtils.quoteUnwrap(matches[ConstraintParser.CONSTRAINT_PATTERN_NAME_GROUP]);
      if (name !== null && name !== undefined) {
        name = name.trim();
      }
      let definition = matches[ConstraintParser.CONSTRAINT_PATTERN_DEFINITION_GROUP];
      if (definition !== null && definition !== undefined) {
        definition = definition.trim();
      }
      parts = [name, definition];
    }
    return parts;
  }
}
