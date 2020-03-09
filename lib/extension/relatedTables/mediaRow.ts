import { MediaTable } from './mediaTable';
import { UserRow } from '../../user/userRow';
import { ImageUtils } from '../../tiles/imageUtils';
import { DBValue } from '../../db/dbAdapter';
import { UserColumn } from '../../user/userColumn';
import { DataTypes } from '../../db/dataTypes';

/**
 * MediaRow module.
 * @module extension/relatedTables
 */

/**
 * User Media Row containing the values from a single result set row
 * @class
 * @extends UserRow
 * @param  {module:extension/relatedTables~MediaTable} mediaTable  media table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export class MediaRow extends UserRow {
  constructor(
    public mediaTable: MediaTable,
    columnTypes?: { [key: string]: DataTypes },
    values?: Record<string, DBValue>,
  ) {
    super(mediaTable, columnTypes, values);
  }
  /**
   * Get the data column
   * @return {module:user/userColumn~UserColumn}
   */
  get dataColumn(): UserColumn {
    return this.mediaTable.dataColumn;
  }
  /**
   * Gets the data
   * @return {Buffer}
   */
  get data(): Buffer {
    return this.getValueWithColumnName(this.dataColumn.name);
  }
  /**
   * Sets the data for the row
   * @param  {Buffer} data data
   */
  set data(data: Buffer) {
    this.setValueWithColumnName(this.dataColumn.name, data);
  }
  /**
   * Get the data image
   *
   * @return {Promise<Image>}
   */
  get dataImage(): Promise<any> {
    return ImageUtils.getImage(this.data, this.contentType);
  }
  /**
   * Get the scaled data image
   * @param {Number} scale
   * @return {Promise<Image>}
   */
  getScaledDataImage(scale: number): Promise<any> {
    return ImageUtils.getScaledImage(this.data, scale);
  }
  /**
   * Get the content type column
   * @return {module:user/userColumn~UserColumn}
   */
  get contentTypeColumn(): UserColumn {
    return this.mediaTable.contentTypeColumn;
  }
  /**
   * Gets the content type
   * @return {string}
   */
  get contentType(): string {
    return this.getValueWithColumnName(this.contentTypeColumn.name);
  }
  /**
   * Sets the content type for the row
   * @param  {string} contentType contentType
   */
  set contentType(contentType: string) {
    this.setValueWithColumnName(this.contentTypeColumn.name, contentType);
  }
}
