import { UserColumn } from './userColumn';
import { UserTable } from './userTable';
import { UserTableMetadataConstants } from './userTableMetadataConstants';

/**
 * User Table Metadata for defining table creation information
 *
 * @param <TColumn>
 *            user column type
 */
export abstract class UserTableMetadata<TColumn extends UserColumn> {
  /**
   * Table name
   */
  protected tableName: string;

  /**
   * Data type
   */
  protected dataType: string;

  /**
   * ID column name
   */
  protected idColumnName: string;

  /**
   * ID autoincrement flag
   */
  protected autoincrement: boolean = UserTable.DEFAULT_AUTOINCREMENT;

  /**
   * Additional table columns
   */
  protected additionalColumns: TColumn[];

  /**
   * Table columns
   */
  protected columns: TColumn[];

  /**
   * Constructor
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public constructor() {}

  /**
   * Get the default data type
   *
   * @return default data type
   */
  public abstract getDefaultDataType(): string;

  /**
   * Build the table columns
   *
   * @return table columns
   */
  public abstract buildColumns(): TColumn[];

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.tableName;
  }

  /**
   * Set the table name
   *
   * @param tableName
   *            table name
   */
  public setTableName(tableName: string): void {
    this.tableName = tableName;
  }

  /**
   * Get the data type
   *
   * @return data type
   */
  public getDataType(): string {
    return this.dataType != null ? this.dataType : this.getDefaultDataType();
  }

  /**
   * Set the data type
   *
   * @param dataType
   *            data type
   */
  public setDataType(dataType: string): void {
    this.dataType = dataType;
  }

  /**
   * Get the id column name
   *
   * @return id column name
   */
  public getIdColumnName(): string {
    return this.idColumnName != null ? this.idColumnName : UserTableMetadataConstants.DEFAULT_ID_COLUMN_NAME;
  }

  /**
   * Set the id column name
   *
   * @param idColumnName
   *            id column name
   */
  public setIdColumnName(idColumnName: string): void {
    this.idColumnName = idColumnName;
  }

  /**
   * Is id autocincrement enabled?
   *
   * @return autoincrement flag
   */
  public isAutoincrement(): boolean {
    return this.autoincrement;
  }

  /**
   * Set the id autoincrement flag
   *
   * @param autoincrement
   *            autoincrement flag
   */
  public setAutoincrement(autoincrement: boolean): void {
    this.autoincrement = autoincrement;
  }

  /**
   * Get the additional table columns
   *
   * @return columns
   */
  public getAdditionalColumns(): TColumn[] {
    return this.additionalColumns;
  }

  /**
   * Set the additional table columns
   *
   * @param additionalColumns
   *            columns
   */
  public setAdditionalColumns(additionalColumns: TColumn[]): void {
    this.additionalColumns = additionalColumns;
  }

  /**
   * Get the table columns
   *
   * @return columns
   */
  public getColumns(): TColumn[] {
    return this.columns;
  }

  /**
   * Set the table columns
   *
   * @param columns
   *            columns
   */
  public setColumns(columns: TColumn[]): void {
    this.columns = columns;
  }
}
