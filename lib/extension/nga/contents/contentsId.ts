/**
 * Contents Id object, for maintaining a unique identifier for contents tables
 * @constructor
 */
export class ContentsId {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'nga_contents_id';

  /**
   * id field name
   */
  public static readonly COLUMN_ID = 'id';

  /**
   * tableName field name
   */
  public static readonly COLUMN_TABLE_NAME = 'table_name';

  /**
   * Id primary key
   */
  private id: number;

  /**
   * The name of the actual content table, foreign key to gpkg_contents
   */
  private table_name: string;

  /**
   * Default Constructor
   */
  public constructor();

  /**
   * Copy Constructor
   * @param contentsId contents id to copy
   */
  public constructor(contentsId: ContentsId);

  /**
   *
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof ContentsId) {
      const contentsId = args[0];
      this.id = contentsId.id;
      this.table_name = contentsId.table_name;
    }
  }

  /**
   * Get the id
   * @return id
   */
  public getId(): number {
    return this.id;
  }

  /**
   * Set the id
   * @param id id
   */
  public setId(id: number): void {
    this.id = id;
  }

  /**
   * Get the table name
   * @return table name
   */
  public getTableName(): string {
    return this.table_name;
  }

  /**
   * Set the table name
   * @param tableName
   */
  public setTableName(tableName: string): void {
    this.table_name = tableName;
  }
}
