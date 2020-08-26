/**
 * Indicates that a particular extension applies to a GeoPackage, a table in a
 * GeoPackage or a column of a table in a GeoPackage. An application that access
 * a GeoPackage can query the gpkg_extensions table instead of the contents of
 * all the user data tables to determine if it has the required capabilities to
 * read or write to tables with extensions, and to “fail fast” and return an
 * error message if it does not.
 */
export class Extension {
  public static readonly EXTENSION_NAME_DIVIDER: string = '_';

  public static readonly READ_WRITE: string = 'read-write';
  public static readonly WRITE_ONLY: string = 'write-only';
  /**
   * Name of the table that requires the extension. When NULL, the extension
   * is required for the entire GeoPackage. SHALL NOT be NULL when the
   * column_name is not NULL.
   */
  table_name: string;
  /**
   * Name of the column that requires the extension. When NULL, the extension
   * is required for the entire table.
   */
  column_name: string;
  /**
   * The case sensitive name of the extension that is required, in the form
   * <author>_<extension_name>.
   */
  extension_name: string;
  /**
   * Definition of the extension in the form specfied by the template in
   * GeoPackage Extension Template (Normative) or reference thereto.
   */
  definition: string;
  /**
   * Indicates scope of extension effects on readers / writers: read-write or
   * write-only in lowercase.
   */
  scope: string;

  setExtensionName(author: string, extensionName: string): void {
    this.extension_name = Extension.buildExtensionName(author, extensionName);
  }
  get author(): string {
    return Extension.getAuthorWithExtensionName(this.extension_name);
  }
  get extensionNameNoAuthor(): string {
    return Extension.getExtensionNameNoAuthor(this.extension_name);
  }
  static buildExtensionName(author: string, extensionName: string): string {
    return author + Extension.EXTENSION_NAME_DIVIDER + extensionName;
  }
  static getAuthorWithExtensionName(extensionName: string): string {
    return extensionName.split(Extension.EXTENSION_NAME_DIVIDER)[0];
  }
  static getExtensionNameNoAuthor(extensionName: string): string {
    return extensionName.slice(extensionName.indexOf(Extension.EXTENSION_NAME_DIVIDER) + 1);
  }
  /**
   * Get the table name
   * @return table name
   */
  getTableName(): string {
    return this.table_name;
  }

  /**
   * Set the table name
   * @param tableName table name
   */
  setTableName(tableName: string) {
    this.table_name = tableName;
    if (tableName === null || tableName === undefined) {
      this.column_name = null;
    }
  }
}
