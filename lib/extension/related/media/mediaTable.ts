/**
 * mediaTable module.
 * @module extension/relatedTables
 */
import { UserRelatedTable } from '../userRelatedTable';
import { RelationType } from '../relationType';
import { UserColumn } from '../../../user/userColumn';
import { GeoPackageDataType } from '../../../db/geoPackageDataType';
import { UserCustomColumn } from '../../../user/custom/userCustomColumn';
import { UserCustomTable } from '../../../user/custom/userCustomTable';
import { UserTable } from '../../../user/userTable';
import type { MediaTableMetadata } from './mediaTableMetadata';
import { UserTableMetadataConstants } from '../../../user/userTableMetadataConstants';

/**
 * Media Requirements Class User-Defined Related Data Table
 */
export class MediaTable extends UserRelatedTable {
  /**
   * User-Defined Media Table relation name
   */
  public static readonly RELATION_TYPE: RelationType = RelationType.MEDIA;

  /**
   * Multimedia content column name
   */
  public static readonly COLUMN_DATA = 'data';

  /**
   * Mime-type of data column name
   */
  public static readonly COLUMN_CONTENT_TYPE = 'content_type';

  /**
   * Constructor
   * @param tableName table name
   * @param columns Array of columns
   * @param idColumnName id column name
   */
  constructor(tableName: string, columns: UserCustomColumn[], idColumnName?: string);

  /**
   * Constructor
   * @param table user custom table
   */
  constructor(table: UserCustomTable);

  /**
   * Constructor
   * @param args
   */
  constructor(...args) {
    if (args.length === 1 && args[0] instanceof UserCustomTable) {
      const table = args[0];
      super(MediaTable.RELATION_TYPE.getName(), MediaTable.RELATION_TYPE.getDataType(), table);
    } else if (args.length >= 2) {
      const tableName = args[0];
      const columns = args[1];
      const idColumnName = (args.length === 3 ? args[2] : null) || UserTableMetadataConstants.DEFAULT_ID_COLUMN_NAME;
      super(
        tableName,
        MediaTable.RELATION_TYPE.getName(),
        MediaTable.RELATION_TYPE.getDataType(),
        columns,
        MediaTable.requiredColumns(idColumnName),
      );
    }
  }

  /**
   * Create a media table with the metadata
   * @param metadata  media table metadata
   * @return media table
   */
  public static create(metadata: MediaTableMetadata): MediaTable {
    const columns = metadata.buildColumns();
    return new MediaTable(metadata.getTableName(), columns, metadata.getIdColumnName());
  }

  /**
   * Create the required table columns with the id column name
   * @param startingIndex starting index
   * @param idColumnName id column name
   * @param autoincrement autoincrement id values
   * @return user custom columns
   */
  public static createRequiredColumns(
    startingIndex = 0,
    idColumnName?: string,
    autoincrement: boolean = UserTable.DEFAULT_AUTOINCREMENT,
  ): UserCustomColumn[] {
    if (idColumnName == null) {
      idColumnName = UserTableMetadataConstants.DEFAULT_ID_COLUMN_NAME;
    }

    const columns = [];
    columns.push(this.createIdColumn(startingIndex++, idColumnName, autoincrement));
    columns.push(this.createDataColumn(startingIndex++));
    columns.push(this.createContentTypeColumn(startingIndex++));

    return columns;
  }

  /**
   * Create the primary key id column
   * @param index column index
   * @param idColumnName id column name
   * @param autoincrement autoincrement id values
   * @return id column
   */
  public static createIdColumn(
    index = 0,
    idColumnName: string = UserTableMetadataConstants.DEFAULT_ID_COLUMN_NAME,
    autoincrement: boolean = UserTable.DEFAULT_AUTOINCREMENT,
  ): UserCustomColumn {
    return UserCustomColumn.createPrimaryKeyColumn(index, idColumnName, autoincrement);
  }

  /**
   * Create a data column
   *
   * @param index
   *            column index
   * @return data column
   */
  public static createDataColumn(index = UserColumn.NO_INDEX): UserCustomColumn {
    return UserCustomColumn.createColumn(index, MediaTable.COLUMN_DATA, GeoPackageDataType.BLOB, true);
  }

  /**
   * Create a content type column
   *
   * @param index
   *            column index
   * @return content type column
   */
  public static createContentTypeColumn(index: number = UserColumn.NO_INDEX): UserCustomColumn {
    return UserCustomColumn.createColumn(index, MediaTable.COLUMN_CONTENT_TYPE, GeoPackageDataType.TEXT, true);
  }

  /**
   * Get the number of required columns
   *
   * @return required columns count
   */
  public static numRequiredColumns(): number {
    return this.requiredColumns().length;
  }

  /**
   * Get the required columns
   */
  static requiredColumns(idColumnName: string = UserTableMetadataConstants.DEFAULT_ID_COLUMN_NAME): string[] {
    const requiredColumns = [];
    requiredColumns.push(idColumnName);
    requiredColumns.push(MediaTable.COLUMN_DATA);
    requiredColumns.push(MediaTable.COLUMN_CONTENT_TYPE);
    return requiredColumns;
  }

  /**
   * Get the id column index
   *
   * @return id column index
   */
  public getIdColumnIndex(): number {
    return this.getPkColumnIndex();
  }

  /**
   * Get the id column
   *
   * @return id column
   */
  public getIdColumn(): UserCustomColumn {
    return this.getPkColumn();
  }

  /**
   * Get the data column index
   *
   * @return data column index
   */
  public getDataColumnIndex(): number {
    return this.getColumnIndex(MediaTable.COLUMN_DATA);
  }

  /**
   * Get the data column
   *
   * @return data column
   */
  public getDataColumn(): UserCustomColumn {
    return this.getColumn(MediaTable.COLUMN_DATA);
  }

  /**
   * Get the content type column index
   *
   * @return content type column index
   */
  public getContentTypeColumnIndex(): number {
    return this.getColumnIndex(MediaTable.COLUMN_CONTENT_TYPE);
  }

  /**
   * Get the content type column
   *
   * @return content type column
   */
  public getContentTypeColumn(): UserCustomColumn {
    return this.getColumn(MediaTable.COLUMN_CONTENT_TYPE);
  }
}
