/**
 * SQLite Master table (sqlite_master) type column keywords
 */

export enum SQLiteMasterType {
  /**
   * Table keyword
   */
  TABLE,

  /**
   * Index keyword
   */
  INDEX,

  /**
   * View keyword
   */
  VIEW,

  /**
   * Trigger keyword
   */
  TRIGGER,
}
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SQLiteMasterType {
  export function nameFromType(type: SQLiteMasterType): string {
    return SQLiteMasterType[type];
  }

  export function fromName(type: string): SQLiteMasterType {
    return SQLiteMasterType[type as keyof typeof SQLiteMasterType] as SQLiteMasterType;
  }
}
