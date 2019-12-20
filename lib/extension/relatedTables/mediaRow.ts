import MediaTable from "./mediaTable";
import UserRow from '../../user/userRow';
import {ImageUtils} from '../../tiles/imageUtils';
import { UserColumn, DataTypes } from "../../..";
import ColumnValues from "../../dao/columnValues";

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
export default class MediaRow extends UserRow {
  constructor(public mediaTable: MediaTable, columnTypes?: DataTypes[], values?: ColumnValues[]) {
    super(mediaTable, columnTypes, values);
  }
  /**
   * Gets the id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn(): UserColumn {
    return this.mediaTable.getIdColumn();
  }
  /**
   * Gets the id
   * @return {Number}
   */
  getId(): number {
    return this.getValueWithColumnName(this.getIdColumn().name);
  }
  /**
   * Get the data column
   * @return {module:user/userColumn~UserColumn}
   */
  getDataColumn(): UserColumn {
    return this.mediaTable.getDataColumn();
  }
  /**
   * Gets the data
   * @return {Buffer}
   */
  getData(): Buffer {
    return this.getValueWithColumnName(this.getDataColumn().name);
  }
  /**
   * Get the data image
   *
   * @return {Promise<Image>}
   */
  getDataImage(): Promise<any> {
    return ImageUtils.getImage(this.getData(), this.getContentType());
  }
  /**
   * Get the scaled data image
   * @param {Number} scale
   * @return {Promise<Image>}
   */
  getScaledDataImage(scale: number): Promise<any> {
    return ImageUtils.getScaledImage(this.getData(), scale);
  }
  /**
   * Sets the data for the row
   * @param  {Buffer} data data
   */
  setData(data: Buffer) {
    this.setValueWithColumnName(this.getDataColumn().name, data);
  }
  /**
   * Get the content type column
   * @return {module:user/userColumn~UserColumn}
   */
  getContentTypeColumn(): UserColumn {
    return this.mediaTable.getContentTypeColumn();
  }
  /**
   * Gets the content type
   * @return {string}
   */
  getContentType(): string {
    return this.getValueWithColumnName(this.getContentTypeColumn().name);
  }
  /**
   * Sets the content type for the row
   * @param  {string} contentType contentType
   */
  setContentType(contentType: string) {
    this.setValueWithColumnName(this.getContentTypeColumn().name, contentType);
  }
}