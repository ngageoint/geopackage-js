/**
 * Table and column name complex primary key
 */
export class TableColumnKey {
  /**
   * Table name
   */
  private tableName: string;

  /**
   * Column name
   */
  private columnName: string;

  /**
   * Constructor
   *
   * @param tableName
   *            table name
   * @param columnName
   *            column name
   */
  public constructor(tableName: string, columnName: string) {
    this.tableName = tableName;
    this.columnName = columnName;
  }

  public getTableName(): string {
    return this.tableName;
  }

  public setTableName(tableName: string): void {
    this.tableName = tableName;
  }

  public getColumnName(): string {
    return this.columnName;
  }

  public setColumnName(columnName: string): void {
    this.columnName = columnName;
  }

  /**
   * {@inheritDoc}
   */
  public toString(): string {
    return this.tableName + ':' + this.columnName;
  }

  /**
   * {@inheritDoc}
   */
  public equals(obj: TableColumnKey): boolean {
    return obj != null && obj.getTableName() === this.getTableName() && obj.getColumnName() === this.getColumnName();
  }
}
