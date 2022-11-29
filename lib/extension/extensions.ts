import { ExtensionScopeType } from './extensionScopeType';

/**
 * Indicates that a particular extension applies to a GeoPackage, a table in a
 * GeoPackage or a column of a table in a GeoPackage. An application that access
 * a GeoPackage can query the gpkg_extensions table instead of the contents of
 * all the user data tables to determine if it has the required capabilities to
 * read or write to tables with extensions, and to “fail fast” and return an
 * error message if it does not.
 */
export class Extensions {
  /**
   * Divider between extension name parts
   */
  public static readonly EXTENSION_NAME_DIVIDER = '_';

  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'gpkg_extensions';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME = 'table_name';

  /**
   * columnName field name
   */
  public static readonly COLUMN_COLUMN_NAME = 'column_name';

  /**
   * extensionName field name
   */
  public static readonly COLUMN_EXTENSION_NAME = 'extension_name';

  /**
   * definition field name
   */
  public static readonly COLUMN_DEFINITION = 'definition';

  /**
   * scope field name
   */
  public static readonly COLUMN_SCOPE = 'scope';

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

  /**
   * Default Constructor
   */
  public constructor();

  /**
   * Copy Constructor
   *
   * @param extensions
   *            extensions to copy
   */
  public constructor(extensions: Extensions);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof Extensions) {
      const extensions = args[0];
      this.table_name = extensions.table_name;
      this.column_name = extensions.column_name;
      this.extension_name = extensions.extension_name;
      this.definition = extensions.definition;
      this.scope = extensions.scope;
    }
  }

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.table_name;
  }

  /**
   * Set the table name
   *
   * @param tableName
   *            table name
   */
  public setTableName(tableName: string): void {
    this.table_name = tableName;
    if (tableName == null) {
      this.column_name = null;
    }
  }

  /**
   * Get the column name
   *
   * @return column name
   */
  public getColumnName(): string {
    return this.column_name;
  }

  /**
   * Set the column name
   *
   * @param columnName
   *            column name
   */
  public setColumnName(columnName: string): void {
    this.column_name = columnName;
  }

  /**
   * Get the extension name
   *
   * @return extension name
   */
  public getExtensionName(): string {
    return this.extension_name;
  }

  /**
   * Set the extension name
   *
   * @param extensionName
   *            extension name
   */
  public setExtensionName(extensionName: string): void {
    this.extension_name = extensionName;
  }

  /**
   * Set the extension name by combining the required parts
   *
   * @param author
   *            author
   * @param extensionName
   *            extension name
   */
  public buildAndSetExtensionName(author: string, extensionName: string): void {
    this.setExtensionName(Extensions.buildExtensionName(author, extensionName));
  }

  /**
   * Get the author from the beginning of the extension name
   *
   * @return author
   */
  public getAuthor(): string {
    return Extensions.getAuthorForExtensionName(this.extension_name);
  }

  /**
   * Get the extension name with the author prefix removed
   *
   * @return extension name without the author
   */
  public getExtensionNameNoAuthor(): string {
    return Extensions.getExtensionNameNoAuthorForExtensionName(this.extension_name);
  }

  /**
   * Get the definition
   *
   * @return definition
   */
  public getDefinition(): string {
    return this.definition;
  }

  /**
   * Set the definition
   *
   * @param definition
   *            definition
   */
  public setDefinition(definition: string): void {
    this.definition = definition;
  }

  /**
   * Get the extension scope type
   *
   * @return extension scope type
   */
  public getScope(): ExtensionScopeType {
    return ExtensionScopeType.fromName(this.scope);
  }

  /**
   * Set the extension scope type
   * @param scope extension scope type
   */
  public setScope(scope: string): void {
    this.scope = scope;
  }

  /**
   * Set the extension scope type
   * @param scope extension scope type
   */
  public setScopeType(scope: ExtensionScopeType): void {
    this.scope = ExtensionScopeType.nameFromType(scope);
  }

  /**
   * Build the extension name by combining the required parts
   *
   * @param author
   *            extension author
   * @param extensionName
   *            extension name
   * @return extension name
   */
  public static buildExtensionName(author: string, extensionName: string): string {
    return author + Extensions.EXTENSION_NAME_DIVIDER + extensionName;
  }

  /**
   * Get the author from the beginning of the extension name
   *
   * @param extensionName
   *            extension name
   * @return author extension author
   */
  public static getAuthorForExtensionName(extensionName: string): string {
    let author = null;
    if (extensionName != null) {
      author = extensionName.substring(0, extensionName.indexOf(Extensions.EXTENSION_NAME_DIVIDER));
    }
    return author;
  }

  /**
   * Get the extension name with the author prefix removed
   *
   * @param extensionName
   *            extension name
   * @return extension name, no author
   */
  public static getExtensionNameNoAuthorForExtensionName(extensionName: string): string {
    let value = null;
    if (extensionName != null) {
      value = extensionName.substring(
        extensionName.indexOf(Extensions.EXTENSION_NAME_DIVIDER) + 1,
        extensionName.length,
      );
    }
    return value;
  }
}
