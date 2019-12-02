
/**
  * Indicates that a particular extension applies to a GeoPackage, a table in a
  * GeoPackage or a column of a table in a GeoPackage. An application that access
  * a GeoPackage can query the gpkg_extensions table instead of the contents of
  * all the user data tables to determine if it has the required capabilities to
  * read or write to tables with extensions, and to “fail fast” and return an
  * error message if it does not.
 */
export default class Extension {
  public static readonly EXTENSION_NAME_DIVIDER = "_";

  public static readonly READ_WRITE = "read-write";
  public static readonly WRITE_ONLY = "write-only";
  /**
   * Name of the table that requires the extension. When NULL, the extension
   * is required for the entire GeoPackage. SHALL NOT be NULL when the
   * column_name is not NULL.
   */
  table_name: String;
    /**
   * Name of the column that requires the extension. When NULL, the extension
   * is required for the entire table.
   */
  column_name: String;
  /**
  * The case sensitive name of the extension that is required, in the form
  * <author>_<extension_name>.
  */
  extension_name: String;
  /**
   * Definition of the extension in the form specfied by the template in
   * GeoPackage Extension Template (Normative) or reference thereto.
   */
  definition: String;
  /**
   * Indicates scope of extension effects on readers / writers: read-write or
   * write-only in lowercase.
   */
  scope: String;

  setExtensionName(author: String, extensionName: String) {
    this.extension_name = Extension.buildExtensionName(author, extensionName);
  }
  getAuthor(): String {
    return Extension.getAuthorWithExtensionName(this.extension_name);
  }
  getExtensionNameNoAuthor(): String {
    return Extension.getExtensionNameNoAuthor(this.extension_name);
  }
  static buildExtensionName(author: String, extensionName: String): String {
    return author + Extension.EXTENSION_NAME_DIVIDER + extensionName;
  }
  static getAuthorWithExtensionName(extensionName: String): String {
    return extensionName.split(Extension.EXTENSION_NAME_DIVIDER)[0];
  }
  static getExtensionNameNoAuthor(extensionName: String): String {
    return extensionName.slice(extensionName.indexOf(Extension.EXTENSION_NAME_DIVIDER) + 1);
  }
}
