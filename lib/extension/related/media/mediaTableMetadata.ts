import { UserCustomColumn } from '../../../user/custom/userCustomColumn';
import { UserTableMetadata } from '../../../user/userTableMetadata';
import { MediaTable } from './mediaTable';

/**
 * Media Table Metadata for defining table creation information
 */
export class MediaTableMetadata extends UserTableMetadata<UserCustomColumn> {
  public static create(): MediaTableMetadata;
  public static create(tableName: string): MediaTableMetadata;
  public static create(tableName: string, autoincrement: boolean): MediaTableMetadata;
  public static create(tableName: string, columns: UserCustomColumn[]): MediaTableMetadata;
  public static create(tableName: string, autoincrement: boolean, columns: UserCustomColumn[]): MediaTableMetadata;
  public static create(tableName: string, idColumnName: string, columns: UserCustomColumn[]): MediaTableMetadata;
  public static create(
    tableName: string,
    idColumnName: string,
    autoincrement: boolean,
    columns: UserCustomColumn[],
  ): MediaTableMetadata;

  /**
   * Create metadata
   * @param args
   * @return MediaTableMetadata
   */
  public static create(...args): MediaTableMetadata {
    let mediaTableMetadata = null;
    if (args.length === 0) {
      mediaTableMetadata = new MediaTableMetadata();
    } else if (args.length === 1) {
      const tableName = args[0];
      mediaTableMetadata = new MediaTableMetadata(tableName, null, null);
    } else if (args.length === 2) {
      const tableName = args[0];
      if (typeof args[1] === 'boolean') {
        const autoincrement = args[1];
        mediaTableMetadata = new MediaTableMetadata(tableName, null, autoincrement, null);
      } else if (args[1].length != null) {
        const columns = args[1];
        mediaTableMetadata = new MediaTableMetadata(tableName, null, columns);
      }
    } else if (args.length === 3) {
      const tableName = args[0];
      if (typeof args[1] === 'boolean') {
        const autoincrement = args[1];
        const columns = args[2];
        mediaTableMetadata = new MediaTableMetadata(tableName, null, autoincrement, columns);
      } else {
        const idColumnName = args[1];
        const columns = args[2];
        mediaTableMetadata = new MediaTableMetadata(tableName, idColumnName, columns);
      }
    } else if (args.length === 4) {
      const tableName = args[0];
      const idColumnName = args[1];
      const autoincrement = args[2];
      const columns = args[3];
      mediaTableMetadata = new MediaTableMetadata(tableName, idColumnName, autoincrement, columns);
    }

    return mediaTableMetadata;
  }

  /**
   * Constructor
   */
  public constructor();

  /**
   * Constructor
   *
   * @param tableName table name
   * @param idColumnName  id column name
   * @param columns columns
   */
  public constructor(tableName: string, idColumnName: string, columns: UserCustomColumn[]);

  /**
   * Constructor
   *
   * @param tableName table name
   * @param idColumnName id column name
   * @param autoincrement autoincrement ids
   * @param columns columns
   */
  public constructor(tableName: string, idColumnName: string, autoincrement: boolean, columns: UserCustomColumn[]);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    super();
    if (args.length === 3) {
      this.tableName = args[0];
      this.idColumnName = args[1];
      this.additionalColumns = args[2];
    } else if (args.length === 4) {
      this.tableName = args[0];
      this.idColumnName = args[1];
      this.autoincrement = args[2];
      this.additionalColumns = args[3];
    }
  }

  /**
   * @inheritDoc
   */
  public getDefaultDataType(): string {
    return null;
  }

  /**
   * @inheritDoc
   */
  public buildColumns(): UserCustomColumn[] {
    let simpleAttributeColumns = this.getColumns();
    if (simpleAttributeColumns == null) {
      simpleAttributeColumns = [];
      simpleAttributeColumns.push(...MediaTable.createRequiredColumns(this.getIdColumnName(), this.isAutoincrement()));

      const additional = this.getAdditionalColumns();
      if (additional != null) {
        simpleAttributeColumns.push(...additional);
      }
    }

    return simpleAttributeColumns;
  }
}
