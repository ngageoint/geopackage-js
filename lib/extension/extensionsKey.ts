export class ExtensionsKey {
  private tableName: string;
  private columnName: string;
  private extensionName: string;

  /**
   * Constructor
   * @param tableName
   * @param columnName
   * @param extensionName
   */
  public constructor(tableName: string, columnName: string, extensionName: string) {
    this.tableName = tableName;
    this.columnName = columnName;
    this.extensionName = extensionName;
  }

  /**
   * Get the extension name
   */
  public getExtensionName(): string {
    return this.extensionName;
  }

  /**
   * Get the column name
   */
  public getColumnName(): string {
    return this.columnName;
  }

  /**
   * Get the table name
   */
  public getTableName(): string {
    return this.tableName;
  }
}
