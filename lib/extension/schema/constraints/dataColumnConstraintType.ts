/**
 * Enumeration of Data Column Constraint Types
 */
export enum DataColumnConstraintType {
  /**
   * Value range
   */
  RANGE,

  /**
   * Enumerated values
   */
  ENUM,

  /**
   * Pattern matching
   */
  GLOB,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DataColumnConstraintType {
  export function nameFromType(type: DataColumnConstraintType): string {
    return DataColumnConstraintType[type];
  }

  export function fromName(type: string): DataColumnConstraintType {
    return DataColumnConstraintType[type as keyof typeof DataColumnConstraintType] as DataColumnConstraintType;
  }
}
