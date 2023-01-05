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
    return type.toLowerCase();
  }

  export function fromName(type: string): ReferenceScopeType {
    switch (type) {
      case 'geopackage':
        return ReferenceScopeType.GEOPACKAGE;
      case 'table':
        return ReferenceScopeType.TABLE;
      case 'column':
        return ReferenceScopeType.COLUMN;
      case 'row':
        return ReferenceScopeType.ROW;
      case 'row/col':
        return ReferenceScopeType.ROW_COL;
    }
    return null;
  }
}
