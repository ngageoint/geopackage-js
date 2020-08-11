export enum ConstraintType {
  /**
   * Primary key table and column constraint
   */
  PRIMARY_KEY,

  /**
   * Unique table and column constraint
   */
  UNIQUE,

  /**
   * Check table and column constraint
   */
  CHECK,

  /**
   * Foreign key table and column constraint
   */
  FOREIGN_KEY,

  /**
   * Not null column constraint
   */
  NOT_NULL,

  /**
   * Default column constraint
   */
  DEFAULT,

  /**
   * Collate column constraint
   */
  COLLATE,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ConstraintType {
  export function nameFromType(type: ConstraintType): string {
    return ConstraintType[type];
  }

  export function fromName(type: string): ConstraintType {
    return ConstraintType[type as keyof typeof ConstraintType] as ConstraintType;
  }

  /**
   * Table constraints
   */
  export const TABLE_CONSTRAINTS = new Set<ConstraintType>([ConstraintType.PRIMARY_KEY, ConstraintType.UNIQUE, ConstraintType.CHECK, ConstraintType.FOREIGN_KEY]);

  /**
   * Column constraints
   */
  export const COLUMN_CONSTRAINTS = new Set<ConstraintType>([ConstraintType.PRIMARY_KEY, ConstraintType.NOT_NULL, ConstraintType.UNIQUE, ConstraintType.CHECK, ConstraintType.DEFAULT, ConstraintType.COLLATE, ConstraintType.FOREIGN_KEY]);

  /**
   * Table constraint parsing lookup values
   */
  const tableLookup = new Map<string, ConstraintType>();
  Array.from(TABLE_CONSTRAINTS).forEach(type => {
    addLookups(tableLookup, type);
  });

  /**
   * Column constraint parsing lookup values
   */
  const columnLookup = new Map<string, ConstraintType>();
  Array.from(COLUMN_CONSTRAINTS).forEach(type => {
    addLookups(columnLookup, type);
  });

  /**
   * Add constraint lookup values
   * @param lookup lookup map
   * @param type constraint type
   */
 function addLookups(lookup: Map<string, ConstraintType>, type: ConstraintType) {
    const name = ConstraintType.nameFromType(type);
    const parts = name.split('_');
    lookup.set(parts[0], type);
    if (parts.length > 0) {
      lookup.set(name.replace('_', ' '), type);
    }
  }

  /**
   * Get a matching table constraint type from the value
   * @param value table constraint name value
   * @return constraint type or null
   */
  export function getTableType(value: string): ConstraintType {
    return tableLookup.get(value.toUpperCase());
  }

  /**
   * Get a matching column constraint type from the value
   *
   * @param value
   *            column constraint name value
   * @return constraint type or null
   */
  export function getColumnType(value: string): ConstraintType {
    return columnLookup.get(value.toUpperCase());
  }

  /**
   * Get a matching constraint type from the value
   *
   * @param value
   *            constraint name value
   * @return constraint type or null
   */
  export function getType(value: string): ConstraintType {
    let type = getTableType(value);
    if (type == null) {
      type = getColumnType(value);
    }
    return type;
  }

}
