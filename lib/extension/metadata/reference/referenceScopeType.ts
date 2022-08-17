/**
 * Reference Scope Type
 */
export enum ReferenceScopeType {
  /**
   * Geopackage
   */
  GEOPACKAGE = 'geopackage',

  /**
   * Table
   */
  TABLE = 'table',

  /**
   * Column
   */
  COLUMN = 'column',

  /**
   * Row
   */
  ROW = 'row',

  /**
   * Row and column
   */
  ROW_COL = 'row/col',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ReferenceScopeType {
  export function nameFromType(type: ReferenceScopeType): string {
    return ReferenceScopeType[type];
  }

  export function fromName(type: string): ReferenceScopeType {
    return ReferenceScopeType[type as keyof typeof ReferenceScopeType] as ReferenceScopeType;
  }
}
