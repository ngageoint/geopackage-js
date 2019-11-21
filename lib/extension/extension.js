
/**
  * Indicates that a particular extension applies to a GeoPackage, a table in a
  * GeoPackage or a column of a table in a GeoPackage. An application that access
  * a GeoPackage can query the gpkg_extensions table instead of the contents of
  * all the user data tables to determine if it has the required capabilities to
  * read or write to tables with extensions, and to “fail fast” and return an
  * error message if it does not.
 * @class Extension
 */
class Extension {
  constructor() {
    /**
     * Name of the table that requires the extension. When NULL, the extension
     * is required for the entire GeoPackage. SHALL NOT be NULL when the
     * column_name is not NULL.
     * @member {String}
     */
    this.table_name = undefined;
    /**
     * Name of the column that requires the extension. When NULL, the extension
     * is required for the entire table.
     * @member {String}
     */
    this.column_name = undefined;
    /**
     * The case sensitive name of the extension that is required, in the form
     * <author>_<extension_name>.
     * @member {String}
     */
    this.extension_name = undefined;
    /**
     * Definition of the extension in the form specfied by the template in
     * GeoPackage Extension Template (Normative) or reference thereto.
     * @member {String}
     */
    this.definition = undefined;
    /**
     * Indicates scope of extension effects on readers / writers: read-write or
     * write-only in lowercase.
     * @member {String}
     */
    this.scope = undefined;
  }
  setExtensionName(author, extensionName) {
    this.extension_name = Extension.buildExtensionName(author, extensionName);
  }
  getAuthor() {
    return Extension.getAuthorWithExtensionName(this.extension_name);
  }
  getExtensionNameNoAuthor() {
    return Extension.getExtensionNameNoAuthor(this.extension_name);
  }
  static buildExtensionName(author, extensionName) {
    return author + Extension.EXTENSION_NAME_DIVIDER + extensionName;
  }
  static getAuthorWithExtensionName(extensionName) {
    return extensionName.split(Extension.EXTENSION_NAME_DIVIDER)[0];
  }
  static getExtensionNameNoAuthor(extensionName) {
    return extensionName.slice(extensionName.indexOf(Extension.EXTENSION_NAME_DIVIDER) + 1);
  }
}

Extension.EXTENSION_NAME_DIVIDER = "_";

Extension.READ_WRITE = "read-write";
Extension.WRITE_ONLY = "write-only";
module.exports = Extension;
