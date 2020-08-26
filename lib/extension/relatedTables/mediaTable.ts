/**
 * mediaTable module.
 * @module extension/relatedTables
 */
import { UserRelatedTable } from './userRelatedTable';
import { RelationType } from './relationType';
import { UserColumn } from '../../user/userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * Media Requirements Class User-Defined Related Data Table
 * @class
 * @extends UserRelatedTable
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @param {string[]} requiredColumns required column names
 */
export class MediaTable extends UserRelatedTable {
  public static readonly RELATION_TYPE: RelationType = RelationType.MEDIA;
  public static readonly COLUMN_ID: string = 'id';
  public static readonly COLUMN_DATA: string = 'data';
  public static readonly COLUMN_CONTENT_TYPE: string = 'content_type';

  readonly TABLE_TYPE: string = 'media';

  constructor(tableName: string, columns?: UserColumn[], requiredColumns?: string[]) {
    super(tableName, MediaTable.RELATION_TYPE.name, MediaTable.RELATION_TYPE.dataType, columns, requiredColumns);
  }

  get tableType(): string {
    return this.TABLE_TYPE;
  }
  /**
   * Get the data column
   * @return {module:user/userColumn~UserColumn}
   */
  get dataColumn(): UserColumn {
    return this.getColumnWithColumnName(MediaTable.COLUMN_DATA);
  }
  /**
   * Get the content type column
   * @return {module:user/userColumn~UserColumn}
   */
  get contentTypeColumn(): UserColumn {
    return this.getColumnWithColumnName(MediaTable.COLUMN_CONTENT_TYPE);
  }
  /**
   * Create a media table with a minimum required columns followed by the additional columns
   * @param  {string} tableName         name of the table
   * @param  {module:user/userColumn~UserColumn[]} [additionalColumns] additional columns
   * @return {module:extension/relatedTables~MediaTable}
   */
  static create(tableName: string, additionalColumns?: UserColumn[]): MediaTable {
    let columns = MediaTable.createRequiredColumns();
    if (additionalColumns) {
      columns = columns.concat(additionalColumns);
    }
    return new MediaTable(tableName, columns, MediaTable.requiredColumns());
  }
  /**
   * Get the required columns
   * @param  {string} [idColumnName=id] id column name
   * @return {string[]}
   */
  static requiredColumns(idColumnName = MediaTable.COLUMN_ID): string[] {
    const requiredColumns = [];
    requiredColumns.push(idColumnName);
    requiredColumns.push(MediaTable.COLUMN_DATA);
    requiredColumns.push(MediaTable.COLUMN_CONTENT_TYPE);
    return requiredColumns;
  }
  /**
   * Get the number of required columns
   * @return {Number}
   */
  static numRequiredColumns(): number {
    return MediaTable.requiredColumns().length;
  }
  /**
   * Create the required columns
   * @param  {Number} [startingIndex=0] starting index of the required columns
   * @param  {string} [idColumnName=id]  id column name
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createRequiredColumns(startingIndex = 0, idColumnName = MediaTable.COLUMN_ID): UserColumn[] {
    return [
      MediaTable.createIdColumn(startingIndex++, idColumnName),
      MediaTable.createDataColumn(startingIndex++),
      MediaTable.createContentTypeColumn(startingIndex++),
    ];
  }
  /**
   * Create the primary key id column
   * @param  {Number} index        index of the column
   * @param  {string} idColumnName name of the id column
   * @return {module:user/userColumn~UserColumn}
   */
  static createIdColumn(index: number, idColumnName: string): UserColumn {
    return UserColumn.createPrimaryKeyColumn(index, idColumnName);
  }
  /**
   * Create the data column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createDataColumn(index: number): UserColumn {
    return UserColumn.createColumn(index, MediaTable.COLUMN_DATA, GeoPackageDataType.BLOB, true);
  }
  /**
   * Create the content type column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createContentTypeColumn(index: number): UserColumn {
    return UserColumn.createColumn(index, MediaTable.COLUMN_CONTENT_TYPE, GeoPackageDataType.TEXT, true);
  }
}
